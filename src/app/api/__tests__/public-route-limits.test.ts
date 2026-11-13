import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const limiter = vi.hoisted(() => ({ outcome: { ok: true } as Record<string, unknown> }));
const health = vi.hoisted(() => ({ insert: vi.fn(async () => ({ ok: true, id: "h1" })) }));
const maps = vi.hoisted(() => ({ reverse: vi.fn(async () => ({ label: "Lekki, Lagos" })) }));
vi.mock("@/lib/server/modules/ip-rate-limit", () => ({
  checkIpRateLimit: vi.fn(async () => limiter.outcome),
}));
vi.mock("@/lib/server/health-service", () => ({ insertHealthLog: health.insert }));
vi.mock("@/lib/google-maps", async (orig) => ({
  ...(await orig<typeof import("@/lib/google-maps")>()),
  reverseGeocodeLatLngServer: maps.reverse,
}));

import { GET as geocode } from "../geocode/route";
import { GET as reverse } from "../reverse-geocode/route";
import { POST as logError } from "../log-error/route";

const limited = { ok: false, reason: "limited", retryAfterSec: 7 };
beforeEach(() => {
  vi.clearAllMocks();
  limiter.outcome = { ok: true };
});

describe("geocode", () => {
  it("still serves curated results within budget", async () => {
    const res = await geocode(new NextRequest("http://localhost/api/geocode?q=Lekki"));
    expect(res.status).toBe(200);
    expect((await res.json()).results.length).toBeGreaterThan(0);
  });
  it("returns 429 with Retry-After when the IP is over budget", async () => {
    limiter.outcome = limited;
    const res = await geocode(new NextRequest("http://localhost/api/geocode?q=Surulere-over"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("7");
  });
  it("does not block when the limiter is unavailable (fail-open outcome is ok:true upstream)", async () => {
    limiter.outcome = { ok: false, reason: "unavailable" };
    const res = await geocode(new NextRequest("http://localhost/api/geocode?q=Ikoyi"));
    expect(res.status).toBe(200);
  });
  it("short queries skip the limiter entirely", async () => {
    limiter.outcome = limited;
    const res = await geocode(new NextRequest("http://localhost/api/geocode?q=a"));
    expect(res.status).toBe(200);
  });
});

describe("reverse-geocode", () => {
  const url = "http://localhost/api/reverse-geocode?lat=6.5&lng=3.3";
  it("still resolves within budget", async () => {
    const res = await reverse(new NextRequest(url));
    expect(res.status).toBe(200);
    expect(maps.reverse).toHaveBeenCalledTimes(1);
  });
  it("returns 429 over budget and does not call the upstream", async () => {
    limiter.outcome = limited;
    const res = await reverse(new NextRequest(url));
    expect(res.status).toBe(429);
    expect(maps.reverse).not.toHaveBeenCalled();
  });
  it("keeps validating input before anything else", async () => {
    const res = await reverse(new NextRequest("http://localhost/api/reverse-geocode?lat=abc&lng=1"));
    expect(res.status).toBe(400);
  });
});

describe("log-error", () => {
  const post = () =>
    logError(
      new Request("https://ona.test/api/log-error", {
        method: "POST",
        body: JSON.stringify({ type: "API Error", message: "boom" }),
      }),
    );
  it("still records errors within budget (anonymous, no session needed)", async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(health.insert).toHaveBeenCalledTimes(1);
  });
  it("returns 429 and writes nothing when flooded", async () => {
    limiter.outcome = limited;
    const res = await post();
    expect(res.status).toBe(429);
    expect(health.insert).not.toHaveBeenCalled();
  });
});
