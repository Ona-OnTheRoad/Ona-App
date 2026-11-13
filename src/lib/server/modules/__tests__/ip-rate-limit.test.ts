import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkIpRateLimit } from "../ip-rate-limit";

const req = (ip?: string) =>
  new Request("https://ona.test/x", { headers: ip ? { "x-forwarded-for": ip } : {} });
const opts = { name: "t", limit: 2, windowMs: 60_000 };

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("VERCEL_ENV", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("checkIpRateLimit", () => {
  it("allows up to the limit, then reports limited with a retry time", async () => {
    const ip = `10.0.0.${Math.floor(Math.random() * 200)}`;
    expect((await checkIpRateLimit(req(ip), opts)).ok).toBe(true);
    expect((await checkIpRateLimit(req(ip), opts)).ok).toBe(true);
    const third = await checkIpRateLimit(req(ip), opts);
    expect(third).toMatchObject({ ok: false, reason: "limited" });
    expect((third as { retryAfterSec: number }).retryAfterSec).toBeGreaterThan(0);
  });

  it("budgets each IP separately", async () => {
    await checkIpRateLimit(req("10.1.0.1"), { ...opts, limit: 1 });
    expect((await checkIpRateLimit(req("10.1.0.1"), { ...opts, limit: 1 })).ok).toBe(false);
    expect((await checkIpRateLimit(req("10.1.0.2"), { ...opts, limit: 1 })).ok).toBe(true);
  });

  it("never rate-limits an unknown IP (no shared bucket)", async () => {
    for (let i = 0; i < 5; i++) expect((await checkIpRateLimit(req(), opts)).ok).toBe(true);
  });

  describe("when the limiter backend is down", () => {
    beforeEach(() => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
      vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("outage"); }));
    });
    it("fails closed by default", async () => {
      expect(await checkIpRateLimit(req("10.2.0.1"), opts)).toEqual({ ok: false, reason: "unavailable" });
    });
    it("fails open when asked to", async () => {
      expect(await checkIpRateLimit(req("10.2.0.1"), { ...opts, failOpen: true })).toEqual({ ok: true });
    });
  });
});
