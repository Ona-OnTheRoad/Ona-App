import { useEffect, useState } from "react";
import type { MotoristVehicle } from "@/lib/types";

type GarageRow = {
  id: string;
  makeName?: string;
  modelName?: string;
  year?: number | null;
  vehicleTypeSlug?: string;
};

/** Garage vehicles (user_vehicles) saved from Shop, invisible to profile. */
export function useGarageVehicles(isAuthenticated: boolean): MotoristVehicle[] {
  const [garageVehicles, setGarageVehicles] = useState<MotoristVehicle[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/shop/vehicles");
        if (!res.ok) return;
        const json = await res.json();
        const list = json?.data?.vehicles;
        if (!cancelled && Array.isArray(list)) {
          setGarageVehicles(
            list
              .map((g: GarageRow) => ({
                id: `gar-${g.id}`,
                vehicleType: g.vehicleTypeSlug || undefined,
                make: g.makeName || "",
                model: g.modelName || "",
                year: g.year ? String(g.year) : undefined,
              }))
              .filter((v: MotoristVehicle) => v.make && v.model),
          );
        }
      } catch {
        /* garage is optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return garageVehicles;
}
