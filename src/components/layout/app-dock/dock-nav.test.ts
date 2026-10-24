import { describe, expect, it } from "vitest";
import { buildDockItems, type DockNavRow } from "./dock-nav";

const t = (k: string) => k;
const row = (href: string, icon: DockNavRow["icon"]): DockNavRow => ({
  href,
  labelKey: "nav.home",
  icon,
});

describe("buildDockItems", () => {
  it("customer: Home, History, Ona Express, Shop, Profile in the bar matching Figma", () => {
    const rows = [
      row("/", "dashboard"),
      row("/history", "history"),
      row("/profile", "profile"),
      row("/wallet", "referral"),
      row("/settings", "settings"),
      row("/shop", "shop"),
      row("/express", "express"),
    ];
    const { primary, more } = buildDockItems(rows, t, "/shop", "/");
    expect(primary.map((p) => p.key)).toEqual([
      "/",
      "/history",
      "/express",
      "/shop",
      "/profile",
    ]);
    expect(more.map((m) => m.key)).toEqual([]);
  });

  it("repair pro: Home, Jobs, Payouts, Shop, Profile in the bar matching Figma", () => {
    const rows = [
      row("/dashboard", "dashboard"),
      row("/jobs", "jobs"),
      row("/profile", "profile"),
      row("/wallet", "referral"),
      row("/settings/payments", "payments"),
      row("/settings", "settings"),
      row("/shop/c/solar", "shop"),
    ];
    const { primary, more } = buildDockItems(
      rows,
      t,
      "/shop/c/solar",
      "/dashboard",
    );
    expect(primary.map((p) => p.key)).toEqual([
      "/dashboard",
      "/jobs",
      "/settings/payments",
      "/shop/c/solar",
      "/profile",
    ]);
    expect(more.map((m) => m.key)).toEqual([]);
  });

  it("skips a tab the backend hid instead of inventing one", () => {
    const rows = [row("/", "dashboard")];
    const { primary } = buildDockItems(rows, t, "/shop", "/");
    expect(primary.map((p) => p.key)).toEqual(["/"]);
  });
});
