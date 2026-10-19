"use client";

import { useState } from "react";
import { Car, Plus, Trash2 } from "lucide-react";
import { VehicleSheet } from "./vehicle-sheet";
import type { MotoristVehiclesState } from "./use-motorist-vehicles";

/** Step 4: optional vehicles (empty state → sheet → list). */
export function StepVehicles({ v: vs }: { v: MotoristVehiclesState }) {
  const [open, setOpen] = useState(false);
  const { vehicles, setVehicles } = vs;
  const addLabel = vehicles.length ? "Enter another vehicle" : "Enter vehicle";
  return (
    <div className="flex flex-col gap-3">
      {vehicles.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {vehicles.map((x) => (
            <li
              key={x.id}
              className="flex items-center gap-3 rounded-ona-card border border-ona-border bg-ona-surface p-3"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ona-brand-soft text-ona-brand-ink"
              >
                <Car className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">
                  {[x.make, x.model].filter(Boolean).join(" ")}
                </span>
                <span className="block truncate text-[12px] text-ona-muted">
                  {[x.year, x.vehicleType].filter(Boolean).join(" · ") ||
                    "Vehicle"}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${[x.make, x.model].filter(Boolean).join(" ")}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-ona-muted"
                onClick={() =>
                  setVehicles((prev) => prev.filter((p) => p.id !== x.id))
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <hr className="border-0 border-t border-ona-border" />
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex h-11 items-center gap-1.5 border-0 bg-transparent px-3 text-[13px] font-semibold text-ona-brand-ink"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        {addLabel}
      </button>
      <VehicleSheet
        open={open}
        v={vs}
        onClose={() => {
          vs.resetDraft();
          setOpen(false);
        }}
      />
    </div>
  );
}
