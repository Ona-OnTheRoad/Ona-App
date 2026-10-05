import type { ActiveVehicle } from "@/components/shop/shop-vehicle-bar";

export type VehicleType = { slug: string; name: string };
export type Make = { id: string; name: string; slug: string };
export type Model = { id: string; name: string; slug: string };
export type GarageV = ActiveVehicle & { id: string; isDefault?: boolean };
