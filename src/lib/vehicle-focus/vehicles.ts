import { bucketForVehicleType } from "./buckets";
import {
  BICYCLE_BRANDS,
  BOAT_BRANDS,
  BUS_BRANDS,
  EQUIPMENT_BRANDS,
  MOTORCYCLE_BRANDS,
  PASSENGER_BRANDS,
  TRUCK_BRANDS,
} from "./brands";
import { MODELS_BY_BRAND } from "./models";

function sortWithAnyOther(list: string[]): string[] {
  return [...list].sort((a, b) => {
    if (a === "Any") return -1;
    if (b === "Any") return 1;
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
}

export function getBrandsForVehicleType(vehicleType: string): string[] {
  switch (bucketForVehicleType(vehicleType)) {
    case "motorcycle":
      return sortWithAnyOther([...MOTORCYCLE_BRANDS]);
    case "boat":
      return sortWithAnyOther([...BOAT_BRANDS]);
    case "equipment":
      return sortWithAnyOther([...EQUIPMENT_BRANDS]);
    case "bus":
      return sortWithAnyOther([...BUS_BRANDS]);
    case "truck":
      return sortWithAnyOther([...TRUCK_BRANDS]);
    case "bicycle":
      return sortWithAnyOther([...BICYCLE_BRANDS]);
    case "passenger":
      return sortWithAnyOther([...PASSENGER_BRANDS]);
    default:
      return sortWithAnyOther([
        ...new Set([
          ...PASSENGER_BRANDS,
          ...TRUCK_BRANDS,
          ...MOTORCYCLE_BRANDS,
        ]),
      ]);
  }
}

/** @deprecated use getBrandsForVehicleType */
export const getMakesForVehicleType = getBrandsForVehicleType;

export function getModelsForBrand(
  brand: string,
  vehicleType?: string,
): string[] {
  // Full catalog for the brand (complete list for whichever brands the user picked)
  const base = MODELS_BY_BRAND[brand] ?? ["Any", "Other"];
  // Only narrow for clear non-car buckets when we have a dedicated list
  if (!vehicleType || vehicleType === "Any") return [...base];
  const bucket = bucketForVehicleType(vehicleType);
  if (bucket === "motorcycle" && brand === "Honda") {
    return ["Any", "CB500", "CBR", "PCX", "Activa", "Africa Twin", "Other"];
  }
  if (bucket === "motorcycle" && brand === "Yamaha") {
    return ["Any", "YZF-R3", "MT-07", "MT-09", "NMAX", "RayZR", "Other"];
  }
  // Passenger / general: always full brand model list
  return [...base];
}

/** @deprecated use getModelsForBrand */
export function getModelsForMake(make: string): string[] {
  return getModelsForBrand(make);
}

export function syncBrandForVehicleType(
  vehicleType: string,
  currentBrand: string,
): string {
  const brands = getBrandsForVehicleType(vehicleType);
  if (brands.includes(currentBrand)) return currentBrand;
  return brands[0] ?? "Any";
}

/** @deprecated */
export const syncMakeForVehicleType = syncBrandForVehicleType;

export function syncModelForBrand(
  brand: string,
  currentModel: string,
  vehicleType?: string,
): string {
  const models = getModelsForBrand(brand, vehicleType);
  if (models.includes(currentModel)) return currentModel;
  return models[0] ?? "Any";
}

/** @deprecated */
export function syncModelForMake(make: string, currentModel: string): string {
  return syncModelForBrand(make, currentModel);
}
