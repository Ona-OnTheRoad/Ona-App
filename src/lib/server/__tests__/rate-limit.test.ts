import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimitAsync, RateLimitUnavailableError, RATE_LIMIT_SCRIPT } from "../modules/rate-limit";

const options = { key: "login:email:private@example.test", limit: 2, windowMs: 60_000 };
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("VERCEL_ENV", "");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function reply(result: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(result)));
}

describe("distributed rate limiting", () => {
  it("uses one EVAL for count and expiry, with hashed private keys", async () => {
    reply({ result: [1, 60_000] });
    expect(await rateLimitAsync(options)).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://redis.example.test");
    const command = JSON.parse(String(init?.body));
    expect(command.slice(0, 3)).toEqual(["EVAL", RATE_LIMIT_SCRIPT, 1]);
    expect(command[3]).toMatch(/^ona:rl:v2:[a-f0-9]{64}$/);
    expect(command[3]).not.toContain("private@example.test");
    expect(command[4]).toBe(60_000);
    expect(init?.cache).toBe("no-store");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
  it("allows the boundary and rejects above it using remaining TTL", async () => {
    reply({ result: [2, 41_500] });
    expect(await rateLimitAsync(options)).toEqual({ ok: true });
    reply({ result: [3, 41_500] });
    expect(await rateLimitAsync(options)).toEqual({ ok: false, retryAfterSec: 42 });
  });
  it("shares the remote budget across concurrent calls and a module restart", async () => {
    let count = 0;
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ result: [++count, 59_000] })));
    const results = await Promise.all(Array.from({ length: 12 }, () => rateLimitAsync(options)));
    expect(results.filter(result => result.ok)).toHaveLength(2);
    vi.resetModules();
    const restarted = await import("../modules/rate-limit");
    expect(await restarted.rateLimitAsync(options)).toEqual({ ok: false, retryAfterSec: 59 });
  });
  it.each([{}, { result: [0, 100] }, { result: [1, -1] }, { result: [1, 60_001] },
    { result: [1.5, 100] }, { result: ["1", "100"] }, { error: "ERR", result: [1, 100] }])(
    "rejects malformed Redis replies without granting work: %j", async value => {
      reply(value);
      await expect(rateLimitAsync(options)).rejects.toBeInstanceOf(Error);
    },
  );
  it("denies HTTP errors, invalid JSON and network outages", async () => {
    for (const response of [new Response("denied", { status: 401 }), new Response("not-json")]) {
      vi.stubGlobal("fetch", vi.fn(async () => response));
      await expect(rateLimitAsync(options)).rejects.toBeInstanceOf(RateLimitUnavailableError);
    }
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("timeout"); }));
    await expect(rateLimitAsync(options)).rejects.toBeInstanceOf(RateLimitUnavailableError);
  });
  it("requires credentials in production and Vercel previews", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    await expect(rateLimitAsync(options)).rejects.toBeInstanceOf(RateLimitUnavailableError);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "preview");
    await expect(rateLimitAsync(options)).rejects.toBeInstanceOf(RateLimitUnavailableError);
  });
  it("permits memory only in undeployed development with no Redis configuration", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const local = { ...options, key: `local:${crypto.randomUUID()}`, windowMs: 100 };
    vi.useFakeTimers();
    try {
      expect((await rateLimitAsync(local)).ok).toBe(true);
      expect((await rateLimitAsync(local)).ok).toBe(true);
      expect((await rateLimitAsync(local)).ok).toBe(false);
      vi.advanceTimersByTime(100);
      expect((await rateLimitAsync(local)).ok).toBe(true);
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "partial-config");
      await expect(rateLimitAsync(local)).rejects.toBeInstanceOf(RateLimitUnavailableError);
    } finally { vi.useRealTimers(); }
  });
});
