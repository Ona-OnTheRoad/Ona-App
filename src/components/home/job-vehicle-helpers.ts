import type { MotoristVehicle, UserProfile } from "@/lib/types";

/** Pure vehicle-label helpers. Kept out of the step component so hooks can use them without loading the vehicle picker UI. */
export function formatVehicleLabel(v: {
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: string;
}): string {
  return [v.vehicleType, v.make, v.model, v.year].filter(Boolean).join(" · ");
}

export function profileVehiclesOf(
  userProfile:
    | Pick<
        UserProfile,
        "vehicles" | "vehicleMake" | "vehicleModel" | "vehicleYear"
      >
    | null
    | undefined,
): MotoristVehicle[] {
  const list = userProfile?.vehicles?.filter(
    (v) => v.make || v.model || v.vehicleType,
  );
  if (list?.length) return list;
  if (userProfile?.vehicleMake || userProfile?.vehicleModel) {
    return [
      {
        id: "primary",
        vehicleType: undefined,
        make: userProfile.vehicleMake || "",
        model: userProfile.vehicleModel || "",
        year: userProfile.vehicleYear,
      },
    ];
  }
  return [];
}

export function canUseVehicleLabel(label: string): boolean {
  return label.trim().length >= 3;
}
