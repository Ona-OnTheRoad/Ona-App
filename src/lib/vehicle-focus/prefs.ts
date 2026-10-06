import { getAllCountries, getLocationsForCountry } from "./locations";
import type { PrefKey } from "./types";
import { VEHICLE_TYPES } from "./vehicle-types";
import { getBrandsForVehicleType, getModelsForBrand } from "./vehicles";

export const PREF_ROWS: { key: PrefKey; label: string }[] = [
  { key: "vehicleType", label: "Vehicle" },
  { key: "brand", label: "Car brands (up to 2)" },
  { key: "model", label: "Models (pick as many as you like)" },
  { key: "country", label: "Country" },
  { key: "location", label: "State" },
];

export function optionsForPref(
  key: PrefKey,
  vehicleType: string,
  brand: string,
  country: string,
): string[] {
  switch (key) {
    case "vehicleType":
      return [...VEHICLE_TYPES];
    case "brand":
      return getBrandsForVehicleType(vehicleType);
    case "model":
      return getModelsForBrand(brand, vehicleType);
    case "country":
      return getAllCountries();
    case "location":
      return getLocationsForCountry(country);
  }
}
