/**
 * Automedics live catalog the only inventory loaded into Ona Shop.
 * Every row is a real SKU from the Automedics price list.
 */

export { AUTOMEDICS_CATEGORIES } from "@/lib/shop/automedics-catalog/categories";
export type { AutomedicsCategorySlug } from "@/lib/shop/automedics-catalog/categories";
export type { AutomedicsProduct } from "@/lib/shop/automedics-catalog/core";
export {
  automedicsImageUrl,
  parseVehicleFitment,
} from "@/lib/shop/automedics-catalog/fitment";

import type { AutomedicsProduct } from "@/lib/shop/automedics-catalog/core";
import { BATTERIES_PRODUCTS } from "@/lib/shop/automedics-catalog/batteries";
import { ENGINE_OIL_PRODUCTS } from "@/lib/shop/automedics-catalog/engine-oil";
import { TRANSMISSION_FLUID_PRODUCTS } from "@/lib/shop/automedics-catalog/transmission-fluid";
import { BRAKE_FLUID_PRODUCTS } from "@/lib/shop/automedics-catalog/brake-fluid";
import { COOLANT_PRODUCTS } from "@/lib/shop/automedics-catalog/coolant";
import { OIL_FILTERS_PRODUCTS } from "@/lib/shop/automedics-catalog/oil-filters";
import { AIR_FILTERS_PRODUCTS } from "@/lib/shop/automedics-catalog/air-filters";
import { CABIN_FILTERS_PRODUCTS } from "@/lib/shop/automedics-catalog/cabin-filters";
import { BRAKE_PADS_1_PRODUCTS } from "@/lib/shop/automedics-catalog/brake-pads-1";
import { BRAKE_PADS_2_PRODUCTS } from "@/lib/shop/automedics-catalog/brake-pads-2";
import { BRAKE_DISCS_PRODUCTS } from "@/lib/shop/automedics-catalog/brake-discs";
import { BRAKE_LININGS_PRODUCTS } from "@/lib/shop/automedics-catalog/brake-linings";
import { SHOCK_ABSORBERS_PRODUCTS } from "@/lib/shop/automedics-catalog/shock-absorbers";
import { BALL_JOINTS_PRODUCTS } from "@/lib/shop/automedics-catalog/ball-joints";
import { STABILIZER_LINKAGES_PRODUCTS } from "@/lib/shop/automedics-catalog/stabilizer-linkages";
import { STABILIZER_RUBBERS_BUSHINGS_PRODUCTS } from "@/lib/shop/automedics-catalog/stabilizer-rubbers-bushings";
import { TIE_ROD_ENDS_SOCKETS_PRODUCTS } from "@/lib/shop/automedics-catalog/tie-rod-ends-sockets";
import { OTHER_ACCESSORIES_PRODUCTS } from "@/lib/shop/automedics-catalog/other-accessories";

export const AUTOMEDICS_PRODUCTS: AutomedicsProduct[] = [
  ...BATTERIES_PRODUCTS,
  ...ENGINE_OIL_PRODUCTS,
  ...TRANSMISSION_FLUID_PRODUCTS,
  ...BRAKE_FLUID_PRODUCTS,
  ...COOLANT_PRODUCTS,
  ...OIL_FILTERS_PRODUCTS,
  ...AIR_FILTERS_PRODUCTS,
  ...CABIN_FILTERS_PRODUCTS,
  ...BRAKE_PADS_1_PRODUCTS,
  ...BRAKE_PADS_2_PRODUCTS,
  ...BRAKE_DISCS_PRODUCTS,
  ...BRAKE_LININGS_PRODUCTS,
  ...SHOCK_ABSORBERS_PRODUCTS,
  ...BALL_JOINTS_PRODUCTS,
  ...STABILIZER_LINKAGES_PRODUCTS,
  ...STABILIZER_RUBBERS_BUSHINGS_PRODUCTS,
  ...TIE_ROD_ENDS_SOCKETS_PRODUCTS,
  ...OTHER_ACCESSORIES_PRODUCTS,
];
