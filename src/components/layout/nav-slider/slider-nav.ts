import type { ComponentType } from "react";
import {
  Briefcase,
  CircleUserRound,
  Gift,
  History,
  Home,
  ShoppingCart,
  Wallet,
  Zap,
} from "lucide-react";
import type { MessageKey } from "@/lib/i18n";
import type { MenuIconName } from "../app-menu/menu-nav";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

export type SliderNavRow = {
  href: string;
  labelKey: MessageKey;
  icon: MenuIconName;
  labelOverride?: string;
};

export type SliderItem = {
  key: string;
  href: string;
  label: string;
  Icon: Icon;
};

/** Outline glyphs from the design, keyed by destination. */
const HREF_ICON: Record<string, Icon> = {
  "/": Home,
  "/dashboard": Home,
  "/history": History,
  "/jobs": Briefcase,
  "/settings/payments": Wallet,
  "/express": Zap,
  "/wallet": Gift,
  "/profile": CircleUserRound,
};

/** Routes that are navigation destinations (tab pages), not their sub-pages. */
export function isNavRoute(pathname: string): boolean {
  return (
    [
      "/",
      "/dashboard",
      "/history",
      "/requests",
      "/wallet",
      "/profile",
      "/express",
      "/notifications",
      "/settings/payments",
    ].includes(pathname) ||
    pathname === "/settings" ||
    pathname === "/jobs" ||
    pathname === "/shop" ||
    pathname.startsWith("/shop/c/")
  );
}

/** Active rule per destination so Home / Settings / Shop highlight correctly. */
export function isNavActive(
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
  if (href === "/express") {
    return pathname === "/express" || pathname.startsWith("/express/");
  }
  if (href === "/notifications") {
    return pathname === "/notifications";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Home destinations reset the trade selector instead of restoring an old flow. */
export const isHomeHref = (href: string, roleHome: string) =>
  href === "/" || href === "/dashboard" || href === roleHome;

/**
 * The slider's rows, in design order. `rows` is the output of
 * applyNavOverrides, so a destination the backend hid is skipped, never invented.
 *   Customer: Home, History, My Shop, Ona Express, Referral & Earn, Profile
 *   Repair Pro: Home, Jobs, Payouts, My Shop, Referral & Earn, Profile
 */
export function buildSliderItems(
  rows: SliderNavRow[],
  t: (k: MessageKey) => string,
  myShopHref: string,
  roleHome: string,
): SliderItem[] {
  const isPro = roleHome === "/dashboard";
  const order = isPro
    ? ["/dashboard", "/jobs", "/settings/payments", myShopHref, "/wallet", "/profile"]
    : ["/", "/history", myShopHref, "/express", "/wallet", "/profile"];

  const labelFor = (r: SliderNavRow): string => {
    if (r.labelOverride) return r.labelOverride;
    if (r.href === "/" || r.href === "/dashboard") return t("nav.home");
    if (r.href === "/history") return t("nav.history");
    if (r.href === "/express") return t("nav.onaExpress");
    if (r.href === "/settings/payments") return "Payouts";
    if (r.href === "/wallet") return t("nav.referralEarn");
    if (r.href === myShopHref || r.href === "/shop") return t("nav.myShop");
    return t(r.labelKey);
  };

  return order
    .map((h) => rows.find((r) => r.href === h))
    .filter((r): r is SliderNavRow => Boolean(r))
    .map((r) => ({
      key: r.href,
      href: r.href,
      label: labelFor(r),
      Icon:
        r.href === myShopHref || r.href === "/shop"
          ? ShoppingCart
          : HREF_ICON[r.href] || Home,
    }));
}
