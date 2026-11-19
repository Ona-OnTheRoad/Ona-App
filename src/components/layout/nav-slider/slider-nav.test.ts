import { describe, expect, it } from "vitest";
import { buildSliderItems, isNavRoute, type SliderNavRow } from "./slider-nav";

const t = (k: string) => k;
const row = (href: string, icon: SliderNavRow["icon"]): SliderNavRow => ({
  href,
  labelKey: "nav.home",
  icon,
});

describe("buildSliderItems", () => {
  it("customer: Home, History, My Shop, Ona Express, Referral & Earn, Profile", () => {
    const rows = [
      row("/", "dashboard"),
      row("/history", "history"),
      row("/profile", "profile"),
      row("/wallet", "referral"),
      row("/settings", "settings"),
      row("/shop", "shop"),
      row("/express", "express"),
    ];
    expect(buildSliderItems(rows, t, "/shop", "/").map((i) => i.key)).toEqual([
      "/",
      "/history",
      "/shop",
      "/express",
      "/wallet",
      "/profile",
    ]);
  });

  it("repair pro: Home, Jobs, Payouts, My Shop, Referral & Earn, Profile", () => {
    const rows = [
      row("/dashboard", "dashboard"),
      row("/jobs", "jobs"),
      row("/profile", "profile"),
      row("/wallet", "referral"),
      row("/settings/payments", "payments"),
      row("/settings", "settings"),
      row("/shop/c/solar", "shop"),
    ];
    expect(
      buildSliderItems(rows, t, "/shop/c/solar", "/dashboard").map((i) => i.key),
    ).toEqual([
      "/dashboard",
      "/jobs",
      "/settings/payments",
      "/shop/c/solar",
      "/wallet",
      "/profile",
    ]);
  });

  it("skips a destination the backend hid instead of inventing one", () => {
    expect(
      buildSliderItems([row("/", "dashboard")], t, "/shop", "/").map((i) => i.key),
    ).toEqual(["/"]);
  });
});

describe("isNavRoute", () => {
  it("is true for destinations and false for their sub-pages", () => {
    expect(isNavRoute("/history")).toBe(true);
    expect(isNavRoute("/shop/c/solar")).toBe(true);
    expect(isNavRoute("/settings/payments/bank")).toBe(false);
    expect(isNavRoute("/requests/abc")).toBe(false);
  });
});
