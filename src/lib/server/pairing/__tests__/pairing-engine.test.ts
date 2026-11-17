import { describe, it, expect } from "vitest";
import {
  MAX_PAIRING_RADIUS_KM,
  nextRadiusKm,
  PAIRING_ROUND_MAX_KM,
  PAIRING_STAGES,
  PAIRING_WINDOW_MS,
} from "@/lib/server/pairing/pairing-engine";

describe("pairing-engine constants", () => {
  it("uses a 144s pairing window", () => {
    expect(PAIRING_WINDOW_MS).toBe(144_000);
  });

  it("defines all five dispatch stages", () => {
    expect(PAIRING_STAGES).toEqual([
      "waiting_for_selected",
      "selected_review",
      "sequential_pairing",
      "waiting_for_pro",
      "reserved",
    ]);
  });

  it("max radius is the last step (10 km)", () => {
    expect(MAX_PAIRING_RADIUS_KM).toBe(10);
  });

  it("escalates the search cap across rounds: 2 → 5 → 10 → 10 km", () => {
    expect(PAIRING_ROUND_MAX_KM).toEqual([2, 5, 10, 10]);
  });
});

describe("nextRadiusKm", () => {
  it("expands step by step from the customer's radius cap", () => {
    expect(nextRadiusKm(1)).toBe(2);
    expect(nextRadiusKm(2)).toBe(5);
    expect(nextRadiusKm(5)).toBe(10);
    expect(nextRadiusKm(10)).toBeNull();
  });

  it("caps expansion at the customer's chosen radius", () => {
    expect(nextRadiusKm(1, 5)).toBe(2);
    expect(nextRadiusKm(2, 5)).toBe(5);
    expect(nextRadiusKm(5, 5)).toBeNull();
    expect(nextRadiusKm(10, 5)).toBeNull();
  });

  it("returns null when at max radius", () => {
    expect(nextRadiusKm(10)).toBeNull();
    expect(nextRadiusKm(11)).toBeNull();
    expect(nextRadiusKm(60)).toBeNull();
  });

  it("returns the first step for a missing radius", () => {
    expect(nextRadiusKm(null)).toBe(1);
  });

  it("returns the next strict step for an intermediate value", () => {
    expect(nextRadiusKm(0)).toBe(1);
    expect(nextRadiusKm(4)).toBe(5);
    expect(nextRadiusKm(7)).toBe(10);
    expect(nextRadiusKm(22)).toBeNull();
  });
});
