import { describe, expect, it } from "vitest";
import { pickCurrentPrices } from "@/lib/server/shop/cart";

const NOW = Date.parse("2026-11-28T12:00:00Z");
const row = (o: Record<string, unknown>) => ({
  variant_id: "v1",
  amount_minor: 100,
  is_active: true,
  effective_from: "2026-01-01T00:00:00Z",
  effective_to: null,
  ...o,
});

describe("pickCurrentPrices (M2)", () => {
  it("ignores a price scheduled for the future", () => {
    const m = pickCurrentPrices(
      [row({ amount_minor: 100 }), row({ amount_minor: 999, effective_from: "2027-01-01T00:00:00Z" })],
      NOW,
    );
    expect(m.get("v1")).toBe(100);
  });
  it("ignores an expired price", () => {
    const m = pickCurrentPrices(
      [row({ amount_minor: 100 }), row({ amount_minor: 50, effective_from: "2026-06-01T00:00:00Z", effective_to: "2026-07-01T00:00:00Z" })],
      NOW,
    );
    expect(m.get("v1")).toBe(100);
  });
  it("newest started price wins", () => {
    const m = pickCurrentPrices(
      [row({ amount_minor: 100 }), row({ amount_minor: 80, effective_from: "2026-10-01T00:00:00Z" })],
      NOW,
    );
    expect(m.get("v1")).toBe(80);
  });
  it("ignores inactive prices and yields no entry when nothing applies", () => {
    expect(pickCurrentPrices([row({ is_active: false })], NOW).has("v1")).toBe(false);
    expect(pickCurrentPrices([], NOW).size).toBe(0);
  });
  it("handles several variants independently", () => {
    const m = pickCurrentPrices([row({}), row({ variant_id: "v2", amount_minor: 7 })], NOW);
    expect([m.get("v1"), m.get("v2")]).toEqual([100, 7]);
  });
});
