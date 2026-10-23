import { describe, expect, it } from "vitest";
import { buildDockItems, type DockNavRow } from "./dock-nav";

const t = (k: string) => k;
const row = (href: string, icon: DockNavRow["icon"]): DockNavRow => ({
  href,
  labelKey: "nav.home",
  icon,
});

describe("buildDockItems", () => {
  it("customer: Home, Shop, History, Profile in the bar; More is empty", () => {
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
      "/shop",
      "/history",
      "/profile",
    ]);
    expect(more).toEqual([]);
  });

  it("repair pro: Dashboard, Jobs, Wallet, Profile in the bar; Shop in More", () => {
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
      "/wallet",
      "/profile",
    ]);
    expect(more.map((m) => m.key)).toContain("/shop/c/solar");
  });

  it("skips a tab the backend hid instead of inventing one", () => {
    const rows = [row("/", "dashboard")];
    const { primary } = buildDockItems(rows, t, "/shop", "/");
    expect(primary.map((p) => p.key)).toEqual(["/"]);
  });
});
