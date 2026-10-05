"use client";

import { useRouter } from "next/navigation";
import { Car, Check, Trash2 } from "lucide-react";
import { writeSessionVehicle } from "@/components/shop/shop-vehicle-bar";
import { cn } from "@/lib/utils";
import { typeName } from "./constants";
import type { GarageV } from "./types";

export function SavedGarage({
  garage,
  isLight,
  muted,
  onSetDefault,
  onRemove,
}: {
  garage: GarageV[];
  isLight: boolean;
  muted: string;
  onSetDefault: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  return (
    <>
      <p className="mt-5 mb-2 text-[13px] font-black">Saved garage</p>
      <div className="flex flex-col gap-1.5">
        {garage.map((v) => (
          <div
            key={v.id}
            className={cn(
              "flex items-center gap-2 rounded-md border-0 px-3 py-2.5 shadow-none ring-0",
            )}
            style={{
              backgroundColor: isLight ? "#f0f0f2" : "#2c2c2e",
              backgroundImage: "none",
              border: "none",
              color: isLight ? "#0f172a" : "#ffffff",
            }}
          >
            <Car className="h-4 w-4 shrink-0 text-[#FF6B35]" />
            <button
              type="button"
              className="min-w-0 flex-1 border-0 bg-transparent text-left"
              onClick={() => {
                writeSessionVehicle(v);
                router.push(
                  `/shop/c/mechanic?allParts=1&makeName=${encodeURIComponent(v.makeName)}&modelName=${encodeURIComponent(v.modelName)}${v.year ? `&year=${v.year}` : ""}${v.vehicleTypeSlug ? `&vehicleType=${encodeURIComponent(v.vehicleTypeSlug)}` : ""}`,
                );
              }}
            >
              <p className="text-[13px] font-bold">
                {[v.year, v.makeName, v.modelName].filter(Boolean).join(" ")}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-[#FF6B35]">
                {v.vehicleTypeSlug ? typeName(v.vehicleTypeSlug) : "Automobile"}
                {v.isDefault ? " · Active" : null}
              </p>
            </button>
            <button
              type="button"
              title="Set active"
              onClick={() => void onSetDefault(v.id)}
              className="rounded-md border-0 bg-transparent p-1.5 text-[#FF6B35]"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Remove"
              onClick={() => void onRemove(v.id)}
              className={cn("rounded-md border-0 bg-transparent p-1.5", muted)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
