import type { VehicleType } from "./types";

export const TYPE_LABELS: Record<string, string> = {
  automobile: "Automobile",
  motorcycle: "Motorcycle",
  truck: "Truck",
  van: "Van",
  bus: "Bus",
  trailer: "Trailer",
  motorhome: "Motorhome / RV",
  atv_utv: "ATV / UTV",
  construction_ag: "Construction & Ag",
  other: "Other",
};

export const FALLBACK_TYPES: VehicleType[] = [
  { slug: "automobile", name: "Automobile" },
  { slug: "truck", name: "Truck" },
  { slug: "trailer", name: "Trailer" },
  { slug: "motorcycle", name: "Motorcycle" },
  { slug: "motorhome", name: "Motorhome / RV" },
];

export function typeName(slug: string): string {
  return TYPE_LABELS[slug] || "Automobile";
}
