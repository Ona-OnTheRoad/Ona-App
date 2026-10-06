export type VehicleBucket =
  | "passenger"
  | "truck"
  | "motorcycle"
  | "boat"
  | "equipment"
  | "bus"
  | "bicycle"
  | "generic";

export function bucketForVehicleType(vehicleType: string): VehicleBucket {
  const t = vehicleType.toLowerCase();
  if (!vehicleType || vehicleType === "Any" || vehicleType === "Other") {
    return "generic";
  }
  if (t.includes("bicycle") || t.includes("e-bike")) return "bicycle";
  if (
    t.includes("motorcycle") ||
    t.includes("scooter") ||
    t.includes("moped") ||
    t.includes("dirt bike") ||
    t.includes("sport bike") ||
    t.includes("atv") ||
    t.includes("tricycle") ||
    t.includes("autocycle") ||
    t.includes("side-by-side") ||
    t.includes("snowmobile")
  ) {
    return "motorcycle";
  }
  if (
    t.includes("boat") ||
    t.includes("jet ski") ||
    t.includes("watercraft") ||
    t.includes("amphibious")
  ) {
    return "boat";
  }
  if (
    t.includes("construction") ||
    t.includes("industrial") ||
    t.includes("agriculture") ||
    t.includes("farm") ||
    t.includes("forklift") ||
    t.includes("crane") ||
    t.includes("generator") ||
    (t.includes("tractor") && !t.includes("semi"))
  ) {
    return "equipment";
  }
  if (t.includes("bus") || t.includes("shuttle")) return "bus";
  if (
    t.includes("truck") ||
    t.includes("trailer") ||
    t.includes("semi") ||
    t.includes("van") ||
    t.includes("pickup") ||
    t.includes("tanker") ||
    t.includes("tow") ||
    t.includes("flatbed") ||
    t.includes("dump") ||
    t.includes("box truck") ||
    t.includes("food truck") ||
    t.includes("refuse") ||
    t.includes("camper") ||
    t.includes("motorhome") ||
    t.includes("rv")
  ) {
    return "truck";
  }
  return "passenger";
}

/** Comprehensive brands by vehicle category */
