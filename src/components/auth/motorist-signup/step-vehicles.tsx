"use client";

import { useState } from "react";
import { Car, ChevronRight } from "lucide-react";
import { OnaAddPill } from "@/components/ui/ona-add-pill";
import { VehicleSheet } from "./vehicle-sheet";
import type { MotoristVehiclesState } from "./use-motorist-vehicles";

/** Step 4: optional vehicles (empty state → sheet → list). */
export function StepVehicles({ v: vs }: { v: MotoristVehiclesState }) {
  const [open, setOpen] = useState(false);
  const { vehicles } = vs;
  const addLabel = vehicles.length ? "Enter another vehicle" : "Enter vehicle";
  return (
    <div className="flex flex-col gap-3">
      {vehicles.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {vehicles.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => {
                  vs.startEdit(x);
                  setOpen(true);
                }}
                className="flex min-h-14 w-full items-center gap-3 rounded-ona-card border border-ona-border bg-ona-surface p-3 text-left"
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
                <ChevronRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-ona-muted"
                />
                <span className="sr-only">Edit</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <OnaAddPill onClick={() => setOpen(true)}>{addLabel}</OnaAddPill>
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
