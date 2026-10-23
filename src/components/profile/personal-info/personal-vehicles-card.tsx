"use client";

import { Car, Trash2 } from "lucide-react";
import { MotoristVehicleWizard } from "@/components/profile/motorist-vehicle-wizard";
import type { MotoristVehicle } from "@/lib/types";

interface PersonalVehiclesCardProps {
  isLight?: boolean;
  vehicles: MotoristVehicle[];
  addingVehicle: boolean;
  setAddingVehicle: (v: boolean) => void;
  persistVehicles: (v: MotoristVehicle[]) => boolean;
  setMsg: (msg: string | null) => void;
  setErr: (err: string | null) => void;
}

export function PersonalVehiclesCard({
  isLight = true,
  vehicles,
  addingVehicle,
  setAddingVehicle,
  persistVehicles,
  setMsg,
  setErr,
}: PersonalVehiclesCardProps) {
  const handleRemove = (id: string) => {
    const next = vehicles.filter((v) => v.id !== id);
    if (persistVehicles(next)) {
      setMsg("Vehicle removed.");
      setErr(null);
    }
  };

  return (
    <div>
      {/* Header with Title & Add Button */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ona-muted">
          VEHICLES
        </h3>

        {!addingVehicle && (
          <button
            type="button"
            onClick={() => {
              setAddingVehicle(true);
              setMsg(null);
              setErr(null);
            }}
            className="text-[13px] font-bold text-ona-ink hover:opacity-80 transition-opacity cursor-pointer"
          >
            + Add vehicle
          </button>
        )}
      </div>

      {/* Vehicle Cards List */}
      <div className="space-y-3">
        {vehicles.length === 0 && !addingVehicle && (
          <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-4 text-center text-ona-muted">
            <p className="text-[13px] font-medium">No vehicles registered yet.</p>
            <button
              type="button"
              onClick={() => setAddingVehicle(true)}
              className="mt-2 text-[12px] font-bold text-brand hover:underline cursor-pointer"
            >
              + Add your first vehicle
            </button>
          </div>
        )}

        {vehicles.map((v) => {
          const title = [v.make, v.model].filter(Boolean).join(" ");
          const details = [v.year, v.color, v.plate].filter(Boolean).join(" · ");

          return (
            <div
              key={v.id}
              className="rounded-ona-ctl border border-ona-border bg-ona-surface shadow-sm p-4 flex items-center justify-between gap-3.5 transition-all"
            >
              {/* Circular Brand Car Icon or Vehicle Photo */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full overflow-hidden bg-ona-brand-soft text-brand">
                {v.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.photo}
                    alt={title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Car className="h-5 w-5" strokeWidth={1.8} />
                )}
              </div>

              {/* Title & Details */}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold leading-tight truncate text-ona-ink">
                  {title || "Vehicle"}
                </p>
                <p className="text-[13px] leading-tight truncate mt-1 text-ona-muted">
                  {details || "Details not specified"}
                </p>
              </div>

              {/* Trash/Delete Button */}
              <button
                type="button"
                onClick={() => handleRemove(v.id)}
                className="p-2 -mr-1 transition-colors rounded-ona-ctl text-ona-muted hover:text-ona-danger active:bg-black/5 dark:active:bg-white/5 cursor-pointer"
                aria-label={`Remove ${title}`}
                title="Remove vehicle"
              >
                <Trash2 className="h-4.5 w-4.5" strokeWidth={1.8} />
              </button>
            </div>
          );
        })}

        {/* Wizard when adding a new vehicle */}
        {addingVehicle && (
          <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-4 shadow-sm">
            <MotoristVehicleWizard
              isLight={isLight}
              onCancel={() => setAddingVehicle(false)}
              onSave={(newVeh: MotoristVehicle) => {
                const next = [...vehicles, newVeh];
                if (persistVehicles(next)) {
                  setAddingVehicle(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
