/**
 * Trade seed catalogs, deeper shop stock for every non-Automedics trade.
 *
 * Flows through the standard demo import pipeline (ona_demo connector) so
 * admins load it exactly like any other source: Admin → Shop → Data sources.
 * Deterministic demo-* ids/skus keep re-imports idempotent.
 *
 * Invariants (enforced by demo-catalog.test.ts):
 * - id starts with "demo-"
 * - categorySlug exists in the trade's taxonomy roots
 * - attributes use only schema keys, include required keys, and never use
 *   vehicle-fitment keys on vehicle-forbidden trades
 */

import type { DemoProduct } from "@/lib/shop/demo-catalog/types";
import { TOWING } from "@/lib/shop/trade-seed-catalogs/towing";
import { BATTERY } from "@/lib/shop/trade-seed-catalogs/battery";
import { AC } from "@/lib/shop/trade-seed-catalogs/ac";
import { BODY } from "@/lib/shop/trade-seed-catalogs/body";
import { ELECTRICAL } from "@/lib/shop/trade-seed-catalogs/electrical";
import { DIAGNOSTICS } from "@/lib/shop/trade-seed-catalogs/diagnostics";
import { FASHION } from "@/lib/shop/trade-seed-catalogs/fashion";
import { PLUMBER } from "@/lib/shop/trade-seed-catalogs/plumber";
import { CARPENTER } from "@/lib/shop/trade-seed-catalogs/carpenter";
import { PAINTER } from "@/lib/shop/trade-seed-catalogs/painter";
import { SOLAR } from "@/lib/shop/trade-seed-catalogs/solar";
import { GENERATOR } from "@/lib/shop/trade-seed-catalogs/generator";

export const TRADE_SEED_PRODUCTS: DemoProduct[] = [
  ...TOWING,
  ...BATTERY,
  ...AC,
  ...BODY,
  ...ELECTRICAL,
  ...DIAGNOSTICS,
  ...FASHION,
  ...PLUMBER,
  ...CARPENTER,
  ...PAINTER,
  ...SOLAR,
  ...GENERATOR,
];
