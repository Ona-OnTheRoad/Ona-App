import { describe, expect, it } from "vitest";
import {
  BROADCAST_TIERS,
  broadcastStartedAtMs,
  broadcastVisibleKm,
  nextTierDelayMs,
  proCanSeeBroadcast,
} from "../broadcast-tiers";

describe("broadcast tiers: closest pros see a job first", () => {
  it("is 2 km at 0 s, 5 km at 10 s and 10 km at 20 s", () => {
    expect(BROADCAST_TIERS.map((t) => [t.afterMs, t.radiusKm])).toEqual([
      [0, 2],
      [10_000, 5],
      [20_000, 10],
    ]);
  });

  it("widens the visible radius only as time passes", () => {
    expect(broadcastVisibleKm(0)).toBe(2);
    expect(broadcastVisibleKm(9_999)).toBe(2);
    expect(broadcastVisibleKm(10_000)).toBe(5);
    expect(broadcastVisibleKm(19_999)).toBe(5);
    expect(broadcastVisibleKm(20_000)).toBe(10);
    expect(broadcastVisibleKm(10 * 60_000)).toBe(10);
  });

  it("treats a negative or invalid elapsed time as the first tier", () => {
    expect(broadcastVisibleKm(-5)).toBe(2);
    expect(broadcastVisibleKm(Number.NaN)).toBe(2);
  });

  it("treats Infinity as every tier open (used to ask 'could anyone ever see this?')", () => {
    expect(broadcastVisibleKm(Number.POSITIVE_INFINITY)).toBe(10);
    expect(nextTierDelayMs(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("reports the delay to the next tier, null after the last", () => {
    expect(nextTierDelayMs(0)).toBe(10_000);
    expect(nextTierDelayMs(4_000)).toBe(6_000);
    expect(nextTierDelayMs(10_000)).toBe(10_000);
    expect(nextTierDelayMs(20_000)).toBeNull();
  });

  it("a 1.5 km pro sees it at once, a 4 km pro waits 10 s, a 9 km pro waits 20 s", () => {
    const base = { customerRadiusKm: 10, proRadiusKm: 10 };
    expect(proCanSeeBroadcast({ ...base, distanceKm: 1.5, elapsedMs: 0 })).toBe(true);
    expect(proCanSeeBroadcast({ ...base, distanceKm: 4, elapsedMs: 0 })).toBe(false);
    expect(proCanSeeBroadcast({ ...base, distanceKm: 4, elapsedMs: 10_000 })).toBe(true);
    expect(proCanSeeBroadcast({ ...base, distanceKm: 9, elapsedMs: 19_000 })).toBe(false);
    expect(proCanSeeBroadcast({ ...base, distanceKm: 9, elapsedMs: 20_000 })).toBe(true);
  });

  it("never exceeds the customer's chosen radius", () => {
    expect(
      proCanSeeBroadcast({ distanceKm: 4, elapsedMs: 60_000, customerRadiusKm: 3, proRadiusKm: 10 }),
    ).toBe(false);
  });

  it("never exceeds the pro's own coverage radius", () => {
    expect(
      proCanSeeBroadcast({ distanceKm: 4, elapsedMs: 60_000, customerRadiusKm: 10, proRadiusKm: 3 }),
    ).toBe(false);
  });

  it("never exceeds the 10 km platform cap even if both radii are larger", () => {
    expect(
      proCanSeeBroadcast({ distanceKm: 11, elapsedMs: 60_000, customerRadiusKm: 50, proRadiusKm: 50 }),
    ).toBe(false);
  });

  it("derives the broadcast start from the latest pairing entry, else creation time", () => {
    const hist = [
      { status: "sequential_pairing", at: "2026-01-01T10:00:00.000Z", by: "motorist" },
      { status: "negotiating", at: "2026-01-01T10:05:00.000Z", by: "x" },
      { status: "sequential_pairing", at: "2026-01-01T10:09:00.000Z", by: "declined:abc" },
    ];
    expect(broadcastStartedAtMs(hist, "2026-01-01T09:00:00.000Z")).toBe(
      Date.parse("2026-01-01T10:09:00.000Z"),
    );
    expect(broadcastStartedAtMs([], "2026-01-01T09:00:00.000Z")).toBe(
      Date.parse("2026-01-01T09:00:00.000Z"),
    );
    expect(broadcastStartedAtMs(null, null)).toBeNull();
  });
});
