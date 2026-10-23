import type { ComponentType } from "react";
import {
  Bell,
  Briefcase,
  CreditCard,
  Gift,
  History,
  Home,
  Settings,
  ShoppingBag,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";
import type { DockItem } from "react-floating-dock";
import type { MessageKey } from "@/lib/i18n";
import type { MenuIconName } from "../app-menu/menu-nav";

type Icon = ComponentType<{ className?: string }>;

const ICONS: Record<MenuIconName, Icon> = {
  dashboard: Home,
  history: History,
  profile: UserRound,
  referral: Gift,
  settings: Settings,
  jobs: Briefcase,
  payments: CreditCard,
  notifications: Bell,
  service: Briefcase,
  shop: ShoppingBag,
  express: Zap,
};

/** Wallet reads "Wallet" in the dock (the drawer used the longer "Referral & Earn"). */
const WALLET_ICON: Icon = Wallet;

export type DockNavRow = {
  href: string;
  labelKey: MessageKey;
  icon: MenuIconName;
  labelOverride?: string;
};

/** Routes where the dock is shown: the tab destinations, not their sub-pages. */
export function dockVisibleOn(pathname: string): boolean {
  return (
    [
      "/",
      "/dashboard",
      "/history",
      "/requests",
      "/wallet",
      "/profile",
    ].includes(pathname) ||
    pathname === "/settings" ||
    pathname === "/jobs" ||
    pathname === "/shop" ||
    pathname.startsWith("/shop/c/")
  );
}

/** Active rule per destination (mirrors the old drawer so Home/Settings/Shop highlight correctly). */
export function isDockActive(
  href: string,
  pathname: string,
  roleHome: string,
  myShopHref: string,
): boolean {
  if (href === "/" || href === "/dashboard" || href === roleHome) {
    return (
      pathname === "/" || pathname === "/dashboard" || pathname === roleHome
    );
  }
  if (href === "/settings/payments") {
    return pathname.startsWith("/settings/payments");
  }
  if (href === "/settings") {
    return (
      pathname === "/settings" ||
      (pathname.startsWith("/settings/") &&
        !pathname.startsWith("/settings/payments"))
    );
  }
  if (href === myShopHref || href === "/shop") {
    return pathname === "/shop" || pathname.startsWith("/shop/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Home destinations reset the trade selector instead of restoring an old flow. */
export const isHomeHref = (href: string, roleHome: string) =>
  href === "/" || href === "/dashboard" || href === roleHome;

/**
 * Split the (override-applied) role nav into the dock's four tabs and the
 * overflow rows. Backend hide/reorder still applies because `rows` is the
 * output of applyNavOverrides.
 */
export function buildDockItems(
  rows: DockNavRow[],
  t: (k: MessageKey) => string,
  myShopHref: string,
  roleHome: string,
  profileIcon?: Icon,
): { primary: DockItem[]; more: DockItem[] } {
  // Customer: Home, Shop, History, Profile (No More sheet; settings, wallet, role-switch live under Profile).
  // Repair Pro: Dashboard, Jobs, Wallet, Profile (Shop, Settings, Payments live in More).
  const isPro = roleHome === "/dashboard";
  const primaryHrefs = isPro
    ? ["/dashboard", "/jobs", "/wallet", "/profile"]
    : ["/", myShopHref, "/history", "/profile"];

  const labelFor = (r: DockNavRow): string => {
    if (r.labelOverride) return r.labelOverride;
    if (r.href === "/") return t("nav.home");
    if (r.href === "/wallet") return t("nav.wallet");
    if (r.href === "/history") return t("nav.history");
    if (r.href === myShopHref || r.href === "/shop") return t("nav.shop");
    return t(r.labelKey);
  };
  const toItem = (r: DockNavRow): DockItem => ({
    key: r.href,
    href: r.href,
    label: labelFor(r),
    icon:
      r.href === "/wallet"
        ? WALLET_ICON
        : r.href === "/profile" && profileIcon
          ? profileIcon
          : ICONS[r.icon],
  });

  const primary = primaryHrefs
    .map((h) => rows.find((r) => r.href === h))
    .filter((r): r is DockNavRow => Boolean(r))
    .map(toItem);
  const taken = new Set(primary.map((p) => p.key));
  const more = isPro ? rows.filter((r) => !taken.has(r.href)).map(toItem) : [];
  return { primary, more };
}
