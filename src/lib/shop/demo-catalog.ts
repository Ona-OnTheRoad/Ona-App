"use client";

/**
 * ONA Shop demo catalog (Phase 2) 70+ realistic demo products.
 * 5+ products × 14 trades, all is_demo = true, deterministic ids/slugs/skus
 * so seeding is idempotent. Attributes match each trade's schema exactly.
 */

export type { DemoProduct } from "@/lib/shop/demo-catalog/types";

import type { DemoProduct } from "@/lib/shop/demo-catalog/types";
import { MECHANIC_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/mechanic";
import { VULCANIZER_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/vulcanizer";
import { TOWING_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/towing";
import { AC_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/ac";
import { BATTERY_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/battery";
import { BODY_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/body";
import { ELECTRICAL_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/electrical";
import { DIAGNOSTICS_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/diagnostics";
import { FASHION_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/fashion";
import { PLUMBER_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/plumber";
import { CARPENTER_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/carpenter";
import { PAINTER_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/painter";
import { SOLAR_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/solar";
import { GENERATOR_DEMO_PRODUCTS } from "@/lib/shop/demo-catalog/generator";
import { TRADE_SEED_PRODUCTS } from "@/lib/shop/trade-seed-catalogs";

const DEMO_PRODUCTS_BASE: DemoProduct[] = [
  ...MECHANIC_DEMO_PRODUCTS,
  ...VULCANIZER_DEMO_PRODUCTS,
  ...TOWING_DEMO_PRODUCTS,
  ...AC_DEMO_PRODUCTS,
  ...BATTERY_DEMO_PRODUCTS,
  ...BODY_DEMO_PRODUCTS,
  ...ELECTRICAL_DEMO_PRODUCTS,
  ...DIAGNOSTICS_DEMO_PRODUCTS,
  ...FASHION_DEMO_PRODUCTS,
  ...PLUMBER_DEMO_PRODUCTS,
  ...CARPENTER_DEMO_PRODUCTS,
  ...PAINTER_DEMO_PRODUCTS,
  ...SOLAR_DEMO_PRODUCTS,
  ...GENERATOR_DEMO_PRODUCTS,
];

/**
 * Full catalog = original 70 demo products + deeper per-trade seeds
 * (12 products × 12 non-Automedics trades). Deterministic ids keep the
 * admin import idempotent, re-imports update, never duplicate.
 */
export const DEMO_PRODUCTS: DemoProduct[] = [
  ...DEMO_PRODUCTS_BASE,
  ...TRADE_SEED_PRODUCTS,
];

export function demoProductsForTrade(tradeKey: string): DemoProduct[] {
  return DEMO_PRODUCTS.filter((p) => p.tradeKey === tradeKey);
}

export function demoProductCountByTrade(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of DEMO_PRODUCTS) {
    out[p.tradeKey] = (out[p.tradeKey] ?? 0) + 1;
  }
  return out;
}

export const DEMO_TRADE_KEYS = [
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
