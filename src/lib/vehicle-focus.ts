/**
 * Service-focus options for Repair Pro signup.
 * Vehicle type → Brand → Model are synchronized.
 * Country → State / Region (all world countries; Nigeria first).
 *
 * This file is a barrel. Importers that only need vehicle data (the home flow, motorist signup)
 * should import from "@/lib/vehicle-focus/vehicle-types" or ".../vehicles" so they do not pull in
 * the country-state-city package, which is large.
 */

export type { PrefKey } from "./vehicle-focus/types";
export { VEHICLE_TYPES } from "./vehicle-focus/vehicle-types";
export {
  getBrandsForVehicleType,
  getMakesForVehicleType,
  getModelsForBrand,
  getModelsForMake,
  syncBrandForVehicleType,
  syncMakeForVehicleType,
  syncModelForBrand,
  syncModelForMake,
} from "./vehicle-focus/vehicles";
export {
  COUNTRIES,
  getAllCountries,
  getLocationsForCountry,
  syncLocationForCountry,
} from "./vehicle-focus/locations";
export { PREF_ROWS, optionsForPref } from "./vehicle-focus/prefs";
