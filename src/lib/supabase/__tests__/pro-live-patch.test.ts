import { describe, expect, it } from "vitest";
import { buildProLivePatch } from "@/lib/supabase/pro-live-patch";

const ALLOWED = [
  "is_online",
  "lat",
  "lng",
  "location_updated_at",
  "updated_at",
];
const NOW = "2026-10-05T10:00:00.000Z";

describe("buildProLivePatch", () => {
  it("going Live stamps location and coordinates", () => {
    expect(buildProLivePatch(true, { lat: 6.5, lng: 3.4 }, NOW)).toEqual({
      is_online: true,
      updated_at: NOW,
      location_updated_at: NOW,
      lat: 6.5,
      lng: 3.4,
    });
  });

  it("going Live without GPS still heartbeats", () => {
    expect(buildProLivePatch(true, undefined, NOW)).toEqual({
      is_online: true,
      updated_at: NOW,
      location_updated_at: NOW,
    });
  });

  it("going Away only flips the flag", () => {
    expect(buildProLivePatch(false, { lat: 1, lng: 2 }, NOW)).toEqual({
      is_online: false,
      updated_at: NOW,
    });
  });

  it("never contains a column outside the allowed set", () => {
    for (const online of [true, false]) {
      const keys = Object.keys(buildProLivePatch(online, { lat: 1, lng: 2 }, NOW));
      for (const k of keys) expect(ALLOWED).toContain(k);
    }
  });
});
