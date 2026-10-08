import "server-only";
import { createHash } from "node:crypto";
import { apiFail } from "@/lib/server/api-json";
import { serverLogger } from "@/lib/server/structured-logger";

type Options = { key: string; limit: number; windowMs: number };
type Result = { ok: true } | { ok: false; retryAfterSec: number };
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Count and expiry belong to one atomic operation, including TTL repair.
export const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if count == 1 or ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

export class RateLimitUnavailableError extends Error {
  readonly status = 503;
  readonly code = "rate_limit_unavailable";
  constructor() {
    super("Security checks unavailable. Retry shortly.");
    this.name = "RateLimitUnavailableError";
  }
}

export function rateLimitUnavailableResponse(error: unknown, req?: Request) {
  if (!(error instanceof RateLimitUnavailableError)) return null;
  serverLogger.error("security.rate_limit.unavailable", { operation: "rate_limit" }, req, error);
  const response = apiFail(error.message, error.status, error.code);
  response.headers.set("Retry-After", "5");
  return response;
}

function localLimit(opts: Options): Result {
  const now = Date.now();
  // Bound idle development buckets; deployed requests never use this map.
  for (const [key, bucket] of buckets) if (now >= bucket.resetAt) buckets.delete(key);
  let bucket = buckets.get(opts.key);
  if (!bucket) {
    bucket = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(opts.key, bucket);
  }
  if (bucket.count >= opts.limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count++;
  return { ok: true };
}

/** Redis is mandatory in production and every Vercel deployment, including previews. */
export async function rateLimitAsync(opts: Options): Promise<Result> {
  if (!opts.key || !Number.isSafeInteger(opts.limit) || opts.limit < 1 ||
      !Number.isSafeInteger(opts.windowMs) || opts.windowMs < 1) {
    throw new RateLimitUnavailableError();
  }
  const url = (process.env.UPSTASH_REDIS_REST_URL || "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  const deployed = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  if (!url && !token && !deployed) return localLimit(opts);
  if (!url || !token) throw new RateLimitUnavailableError();
  try {
    const endpoint = new URL(url);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password ||
        endpoint.search || endpoint.hash) throw new Error("Invalid Redis endpoint");
    // Do not store email addresses, phone numbers or IPs verbatim in Redis keys.
    const digest = createHash("sha256").update(opts.key).digest("hex");
    const response = await fetch(url.replace(/\/$/, ""), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", RATE_LIMIT_SCRIPT, 1, `ona:rl:v2:${digest}`, opts.windowMs]),
      signal: AbortSignal.timeout(2_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Redis HTTP failure");
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || "error" in payload || !("result" in payload)) {
      throw new Error("Invalid Redis response");
    }
    const values = payload.result;
    if (!Array.isArray(values) || values.length !== 2) throw new Error("Invalid counter");
    const [count, ttl] = values;
    if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(ttl) || ttl < 0 || ttl > opts.windowMs) {
      throw new Error("Invalid counter or expiry");
    }
    return count > opts.limit
      ? { ok: false, retryAfterSec: Math.max(1, Math.ceil(ttl / 1000)) }
      : { ok: true };
  } catch {
    // No memory fallback after configured Redis fails, even in development.
    throw new RateLimitUnavailableError();
  }
}
