import type { MessageKey } from "@/lib/i18n";
import type { AccountType, ProService } from "@/lib/types";

/** Trade glyph */
export const TRADE_ICON_GLYPH = "#FF6B35";

export type MenuIconName =
  | "dashboard"
  | "history"
  | "profile"
  | "referral"
  | "settings"
  | "jobs"
  | "payments"
  | "notifications"
  | "service"
  | "shop"
  | "express";

/** Settings sits in the same list arrangement as other menu items (not inside Profile).
 * Messages removed from ☰ chat only via active request/job.
 * Notifications opens the Notification Center (text + unread badge).
 */
/** Customer: money setup lives under Settings (not side drawer). */
export const CLIENT_NAV: {
  href: string;
  labelKey: MessageKey;
  icon: MenuIconName;
  labelOverride?: string;
}[] = [
  { href: "/", labelKey: "nav.dashboard", icon: "dashboard" },
  { href: "/history", labelKey: "nav.history", icon: "history" },
  { href: "/profile", labelKey: "nav.profile", icon: "profile" },
  { href: "/wallet", labelKey: "nav.referralEarn", icon: "referral" },
  { href: "/settings", labelKey: "menu.settings", icon: "settings" },
  /** ONA Shop full repair commerce (catalog, cart, checkout, orders) */
  { href: "/shop", labelKey: "nav.myShop", icon: "shop" },
  /** Ona Express premium direct booking (Vehicle Services) */
  { href: "/express", labelKey: "nav.onaExpress", icon: "express" },
];

/** Repair Pro: dedicated Payments & Payouts in the side bar → full hub. */
export const PRO_NAV: {
  href: string;
  labelKey: MessageKey;
  icon: MenuIconName;
  labelOverride?: string;
}[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "dashboard" },
  { href: "/jobs", labelKey: "nav.jobs", icon: "jobs" },
  { href: "/profile", labelKey: "nav.profile", icon: "profile" },
  { href: "/wallet", labelKey: "nav.referralEarn", icon: "referral" },
  {
    href: "/settings/payments",
    labelKey: "settings.hub.payments",
    icon: "payments",
  },
  { href: "/settings", labelKey: "menu.settings", icon: "settings" },
  /** ONA Shop same commerce engine as customers (Ona is seller) */
  { href: "/shop", labelKey: "nav.myShop", icon: "shop" },
  /** Ona Express premium direct booking */
  { href: "/express", labelKey: "nav.onaExpress", icon: "express" },
];

/** Map pro trade id → i18n key so My Service follows chosen language */
export const TRADE_LABEL_KEY: Record<ProService, MessageKey> = {
  mechanic: "trade.mechanic",
  vulcanizer: "trade.vulcanizer",
  towing: "trade.towing",
  battery: "trade.battery",
  ac: "trade.ac",
  body: "trade.body",
  electrical: "trade.electrical",
  diagnostics: "trade.diagnostics",
  fashion: "trade.fashion",
  plumber: "trade.plumber",
  carpenter: "trade.carpenter",
  painter: "trade.painter",
  solar: "trade.solar",
  generator: "trade.generator",
};

export function homeForRole(type: AccountType): string {
  return type === "professional" ? "/dashboard" : "/";
}

/**
 * ☰ header: first + last name only (drop middle names).
 * "Chinedu James Okafor" → "Chinedu Okafor"; single token stays as-is.
 */
export function firstAndLastName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
