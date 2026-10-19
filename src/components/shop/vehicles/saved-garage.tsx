"use client";

import { useRouter } from "next/navigation";
import { Car, Check, Trash2 } from "lucide-react";
import { writeSessionVehicle } from "@/components/shop/shop-vehicle-bar";
import { onaEyebrowClass } from "@/components/ui/ona-field";
import { typeName } from "./constants";
import type { GarageV } from "./types";

export function SavedGarage({
  garage,
  onSetDefault,
  onRemove,
}: {
  garage: GarageV[];
  onSetDefault: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  return (
    <>
      <p className={`${onaEyebrowClass} mb-2 mt-6`}>Saved garage</p>
      <div className="flex flex-col gap-1.5">
        {garage.map((v) => (
          <div
            key={v.id}
            className="flex items-center gap-2 rounded-ona-card border border-ona-border bg-ona-surface px-3 py-2.5"
          >
            <Car className="h-4 w-4 shrink-0 text-ona-brand-ink" />
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
              <p className="text-[13px] font-semibold text-ona-ink">
                {[v.year, v.makeName, v.modelName].filter(Boolean).join(" ")}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-ona-brand-ink">
                {v.vehicleTypeSlug ? typeName(v.vehicleTypeSlug) : "Automobile"}
                {v.isDefault ? " · Active" : null}
              </p>
            </button>
            <button
              type="button"
              title="Set active"
              aria-label="Set active"
              onClick={() => void onSetDefault(v.id)}
              className="rounded-md border-0 bg-transparent p-2 text-ona-brand-ink"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Remove"
              aria-label="Remove"
              onClick={() => void onRemove(v.id)}
              className="rounded-md border-0 bg-transparent p-2 text-ona-muted"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
