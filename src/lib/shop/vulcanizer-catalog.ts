"use client";

/**
 * ONA Vulcanizer Shop catalog real product classes grounded in ETRTO
 * standard sizes, load indexes and speed symbols (ETRTO Standards Manual 2024,
 * GOV.UK MOT load-index tables) and the tyre/rim compatibility tables.
 *
 * Every tyre size + service description below is a real, standard ETRTO
 * fitment. Load index ↔ kg and speed symbol ↔ km/h follow the official tables.
 * No speculative OEM fitments are claimed; fitment rows are only added from
 * verified source data. Where a spec is not confirmed, `verificationStatus`
 * is "pending".
 *
 * These records stream through the standard import pipeline (see
 * src/lib/server/shop/connectors/vulcanizer.ts), so every product gets full
 * data-source/staging/validation/change-log provenance.
 */

export type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";
export {
  LOAD_INDEX_KG,
  SPEED_SYMBOL_KMH,
} from "@/lib/shop/vulcanizer-catalog/tables";

import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";
import { TIRES_1_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/tires-1";
import { TIRES_2_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/tires-2";
import { TUBES_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/tubes";
import { RIMS_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/rims";
import { VALVES_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/valves";
import { TPMS_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/tpms";
import { PATCHES_REPAIR_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/patches-repair";
import { VULCANIZING_MATERIALS_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/vulcanizing-materials";
import { VULCANIZING_EQUIPMENT_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/vulcanizing-equipment";
import { TIRE_CHANGERS_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/tire-changers";
import { BEAD_BREAKERS_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/bead-breakers";
import { COMPRESSORS_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/compressors";
import { INFLATION_GAUGES_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/inflation-gauges";
import { BALANCING_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/balancing";
import { ALIGNMENT_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/alignment";
import { TYRE_LEVERS_TOOLS_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/tyre-levers-tools";
import { BUFFING_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/buffing";
import { POWER_TOOLS_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/power-tools";
import { GARAGE_EQUIPMENT_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/garage-equipment";
import { TYRE_CARE_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/tyre-care";
import { SAFETY_PPE_PRODUCTS } from "@/lib/shop/vulcanizer-catalog/safety-ppe";

export const VULCANIZER_PRODUCTS: VulcanizerProduct[] = [
  ...TIRES_1_PRODUCTS,
  ...TIRES_2_PRODUCTS,
  ...TUBES_PRODUCTS,
  ...RIMS_PRODUCTS,
  ...VALVES_PRODUCTS,
  ...TPMS_PRODUCTS,
  ...PATCHES_REPAIR_PRODUCTS,
  ...VULCANIZING_MATERIALS_PRODUCTS,
  ...VULCANIZING_EQUIPMENT_PRODUCTS,
  ...TIRE_CHANGERS_PRODUCTS,
  ...BEAD_BREAKERS_PRODUCTS,
  ...COMPRESSORS_PRODUCTS,
  ...INFLATION_GAUGES_PRODUCTS,
  ...BALANCING_PRODUCTS,
  ...ALIGNMENT_PRODUCTS,
  ...TYRE_LEVERS_TOOLS_PRODUCTS,
  ...BUFFING_PRODUCTS,
  ...POWER_TOOLS_PRODUCTS,
  ...GARAGE_EQUIPMENT_PRODUCTS,
  ...TYRE_CARE_PRODUCTS,
  ...SAFETY_PPE_PRODUCTS,
];

export function vulcanizerProductCount(): number {
  return VULCANIZER_PRODUCTS.length;
}
