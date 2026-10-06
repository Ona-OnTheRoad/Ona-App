/**
 * ONA Shop taxonomy single source of truth for the 14 Repair Pro trades.
 *
 * Shared server + client module (no "use client"). Each trade maps to its own
 * category tree. Vehicle fitment is only for vehicle-based trades.
 *
 * Trade keys match PRO_TRADE_OPTIONS ids in @/lib/services.
 */

export const SHOP_TRADE_KEYS = [
  "mechanic",
  "vulcanizer",
  "towing",
  "ac",
  "battery",
  "body",
  "electrical",
  "diagnostics",
  "fashion",
  "plumber",
  "carpenter",
  "painter",
  "solar",
  "generator",
] as const;

export type ShopTradeKey = (typeof SHOP_TRADE_KEYS)[number];

/** Trades that may use vehicle fitment (Make/Model/Year/Engine/Garage). */
export const VEHICLE_BASED_TRADES: ReadonlySet<ShopTradeKey> = new Set([
  "mechanic",
  "vulcanizer",
  "towing",
  "ac",
  "battery",
  "body",
  "electrical",
  "diagnostics",
]);

export function isVehicleTrade(tradeKey: string | null | undefined): boolean {
  if (!tradeKey) return false;
  return VEHICLE_BASED_TRADES.has(tradeKey as ShopTradeKey);
}

export function isShopTrade(tradeKey: string | null | undefined): boolean {
  if (!tradeKey) return false;
  return (SHOP_TRADE_KEYS as readonly string[]).includes(tradeKey);
}

export type TradeCategorySeed = {
  /** Unique within trade. kebab-case slug. */
  slug: string;
  name: string;
  /** Optional children (depth 2) currently flat roots only in Phase 1. */
  children?: TradeCategorySeed[];
};

export type TradeSeed = {
  key: ShopTradeKey;
  name: string;
  vehicleBased: boolean;
  roots: TradeCategorySeed[];
};

import { VEHICLE_TRADE_SEEDS } from "./taxonomy/trades-vehicle";
import { OTHER_TRADE_SEEDS } from "./taxonomy/trades-other";

/** Root category taxonomy per trade (Phase 1 scope). */
export const SHOP_TRADE_TAXONOMY: TradeSeed[] = [
  ...VEHICLE_TRADE_SEEDS,
  ...OTHER_TRADE_SEEDS,
];

export function getRootCategoriesForTrade(
  tradeKey: string,
): TradeCategorySeed[] {
  return SHOP_TRADE_TAXONOMY.find((t) => t.key === tradeKey)?.roots ?? [];
}

export function getTradeSeed(tradeKey: string): TradeSeed | undefined {
  return SHOP_TRADE_TAXONOMY.find((t) => t.key === tradeKey);
}

export function getTradeDisplayName(tradeKey: string): string {
  return getTradeSeed(tradeKey)?.name ?? tradeKey;
}
