import type { MotoristVehicle, UserProfile } from "@/lib/types";

export function vehiclesFromProfile(p: UserProfile): MotoristVehicle[] {
  if (Array.isArray(p.vehicles) && p.vehicles.length > 0) return p.vehicles;
  if (p.vehicleMake || p.vehicleModel) {
    return [
      {
        id: "legacy-primary",
        make: p.vehicleMake || "",
        model: p.vehicleModel || "",
        year: p.vehicleYear,
        plate: p.vehiclePlate,
        photo: p.vehiclePhoto,
        commonIssues: p.vehicleCommonIssues,
      },
    ];
  }
  return [];
}

export function legacyFieldsFromVehicles(list: MotoristVehicle[]) {
  const first = list[0];
  if (!first) {
    return {
      vehicleMake: undefined as string | undefined,
      vehicleModel: undefined as string | undefined,
      vehicleYear: undefined as string | undefined,
      vehiclePlate: undefined as string | undefined,
      vehiclePhoto: undefined as string | undefined,
      vehicleCommonIssues: undefined as string[] | undefined,
    };
  }
  return {
    vehicleMake: first.make || undefined,
    vehicleModel: first.model || undefined,
    vehicleYear: first.year,
    vehiclePlate: first.plate,
    vehiclePhoto: first.photo,
    vehicleCommonIssues: first.commonIssues,
  };
}
