/**
 * Repair Pro / artisan trade catalog for Ona.
 * Motorist filter uses `service`; specialty is artisan self-description.
 */

import type { ProService } from "@/lib/types";
import { ARTISAN_TRADE_CATALOG } from "./catalog/trades";
import type { ArtisanTradeDef } from "./catalog/trades";

export { ARTISAN_TRADE_CATALOG };
export type { ArtisanTradeDef };
export {
  NG_STATES,
  LAGOS_CITIES,
  COMMON_TOOLS_SUGGESTIONS,
} from "./catalog/locations";

/**
 * Trades that prompt motorists for Home / Office / Industrial (etc.) specialty
 * in place of the radius slider until one option is picked.
 */
export const SPECIALTY_PICKER_TRADES: ProService[] = [
  "plumber",
  "carpenter",
  "painter",
  "solar",
  "generator",
  "ac",
  "electrical",
];

export function isSpecialtyPickerTrade(
  service: string | null | undefined,
): boolean {
  return SPECIALTY_PICKER_TRADES.includes(service as ProService);
}

/** Compact labels for home specialty strip */
export function specialtyChipLabel(specialty: string): string {
  const s = specialty.toLowerCase();
  if (s.includes("residential") || s.includes("home")) return "Home";
  if (s.includes("office")) return "Office";
  if (s.includes("commercial")) return "Commercial";
  if (s.includes("industrial")) return "Industrial";
  if (s.includes("furniture") || s.includes("fit-out")) return "Furniture";
  if (s.includes("exterior") || s.includes("facade")) return "Exterior";
  if (s.includes("vehicle") || s === "auto" || s.includes("auto "))
    return "Vehicle";
  if (s.includes("electronics")) return "Electronics";
  if (s.includes("mobile")) return "Mobile";
  // Short catalog labels (Vehicle / Commercial / …) show as-is
  if (specialty.length <= 14) return specialty;
  return `${specialty.slice(0, 12)}…`;
}

/**
 * Pure vehicle / auto trades always use vehicle focus (type/brand/model)
 * and show vehicle fields on customer request.
 * Single source of truth for signup, admin, request UI, jobs.
 * (Never include non-services like "panel".)
 */
export const AUTOMOTIVE_TRADES: readonly ProService[] = [
  "mechanic",
  "vulcanizer",
  "towing",
  "battery",
  "body",
  "diagnostics",
] as const;

export function isAutomotiveTrade(
  service: ProService | string | null | undefined,
): boolean {
  return AUTOMOTIVE_TRADES.includes(service as ProService);
}

/**
 * Whether this pro/request should collect vehicle details.
 * AC / Electric only when the pro’s specialties include vehicle/auto work
 * (home / industrial / commercial specialty variants do not).
 */
export function showsVehicleOnRequest(
  service: ProService | string | null | undefined,
  specialties?: string[] | null,
): boolean {
  const s = (service || "") as ProService;
  if (isAutomotiveTrade(s)) return true;
  if (s !== "ac" && s !== "electrical") return false;
  const list = (specialties || []).map((x) => String(x).toLowerCase());
  if (!list.length) {
    // Legacy pros without specialty chips allow vehicle when trade can be auto
    return true;
  }
  // Any vehicle-focused specialty → show vehicle picker
  if (list.some((x) => x.includes("vehicle") || x.includes("auto"))) {
    return true;
  }
  // Only home / commercial / industrial / electronics → no vehicle fields
  return false;
}

/**
 * Signup “Vehicles you fix” step + vehicle_focus brand storage.
 * Home trades (solar, generator, plumber, …) never.
 * AC / Electric only when focus is Vehicle.
 */
export function needsVehiclesSignupStep(
  service: ProService | string | null | undefined,
  specialty?: string | null,
  specialties?: string[] | null,
): boolean {
  const s = (service || "") as ProService;
  if (!s) return false;
  if (isAutomotiveTrade(s)) return true;
  if (s === "ac" || s === "electrical") {
    const list = [specialty, ...((specialties || []) as string[])]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());
    if (!list.length) return false;
    return list.some((x) => x.includes("vehicle") || x.includes("auto"));
  }
  return false;
}

/** Persist vehicle brands/models in vehicle_focus (vs home specialty blob). */
export function storesVehicleBrandFocus(
  service: ProService | string | null | undefined,
  specialty?: string | null,
  specialties?: string[] | null,
): boolean {
  return needsVehiclesSignupStep(service, specialty, specialties);
}

export function tradeDef(service: ProService): ArtisanTradeDef | undefined {
  return ARTISAN_TRADE_CATALOG.find((t) => t.service === service);
}
