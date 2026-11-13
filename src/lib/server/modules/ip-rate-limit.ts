import "server-only";
import { clientIp } from "./security";
import { rateLimitAsync, RateLimitUnavailableError } from "./rate-limit";

export type IpLimitOutcome =
  | { ok: true }
  | { ok: false; reason: "limited"; retryAfterSec: number }
  | { ok: false; reason: "unavailable" };

/**
 * Per-client-IP budget for routes that must stay reachable without a session
 * (signup-time ID checks, address search, client error reports).
 *
 * - Unknown IP: no bucket is created (one shared "unknown" bucket would let a
 *   single caller lock everyone out), so the request is allowed.
 * - `failOpen`: if the limiter backend is down, allow the request instead of
 *   returning "unavailable". Use it for low-risk routes; leave it off for
 *   routes that spend money or touch identity data.
 */
export async function checkIpRateLimit(
  req: Request,
  opts: { name: string; limit: number; windowMs: number; failOpen?: boolean },
): Promise<IpLimitOutcome> {
  const ip = clientIp(req);
  if (ip === "unknown") return { ok: true };
  try {
    const r = await rateLimitAsync({
      key: `ip:${opts.name}:${ip}`,
      limit: opts.limit,
      windowMs: opts.windowMs,
    });
    return r.ok
      ? { ok: true }
      : { ok: false, reason: "limited", retryAfterSec: r.retryAfterSec };
  } catch (error) {
    if (error instanceof RateLimitUnavailableError && !opts.failOpen) {
      return { ok: false, reason: "unavailable" };
    }
    if (error instanceof RateLimitUnavailableError) return { ok: true };
    throw error;
  }
}
