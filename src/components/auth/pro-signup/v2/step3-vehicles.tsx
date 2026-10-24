"use client";

import { useState } from "react";
import { Car, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { MotoristVehicle } from "@/lib/types";
import { EnterVehicleSheet } from "./enter-vehicle-sheet";

interface Step3VehiclesProps {
  vehicles: MotoristVehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<MotoristVehicle[]>>;
  anyType: boolean;
  setAnyType: (val: boolean) => void;
  onContinue: () => void;
}

export function Step3Vehicles({
  vehicles,
  setVehicles,
  anyType,
  setAnyType,
  onContinue,
}: Step3VehiclesProps) {
  const [showSheet, setShowSheet] = useState(false);

  const handleAddVehicle = (v: MotoristVehicle) => {
    setVehicles((prev) => [...prev, v]);
    setAnyType(false); // If user enters a specific vehicle, uncheck "Any type"
  };

  const handleRemoveVehicle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const isValid = anyType || vehicles.length > 0;

  return (
    <div className="flex flex-col flex-1 px-5 pt-4 pb-6 bg-ona-bg text-ona-ink">
      {/* Title & Subtitle */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ona-ink tracking-tight">
          Vehicles you fix
        </h1>
        <p className="mt-1 text-xs text-ona-muted">
          Add vehicle types you fix best
        </p>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {/* Any Type Card */}
        <button
          type="button"
          onClick={() => setAnyType(!anyType)}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            anyType
              ? "border-brand bg-ona-brand-soft shadow-sm"
              : "border-ona-border bg-ona-surface hover:border-ona-muted"
          }`}
        >
          <div>
            <div className="text-sm font-semibold text-ona-ink">
              Any type
            </div>
            <div className="text-xs text-ona-muted mt-0.5">
              Vehicle, Make, Model, Year
            </div>
          </div>

          {/* Radio circle */}
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              anyType
                ? "border-brand bg-brand"
                : "border-ona-border bg-transparent"
            }`}
          >
            {anyType && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </button>

        {/* Added Vehicles List */}
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-ona-border bg-ona-surface shadow-xs"
          >
            <div className="flex items-center gap-3">
              {/* Soft brand circle with Car icon */}
              <div className="w-10 h-10 rounded-full bg-ona-brand-soft flex items-center justify-center shrink-0">
                <Car className="w-5 h-5 text-brand" />
              </div>

              <div>
                <div className="text-sm font-semibold text-ona-ink">
                  {v.make} {v.model}
                </div>
                <div className="text-xs text-ona-muted mt-0.5">
                  {[v.year, v.vehicleType || "Car"].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => handleRemoveVehicle(v.id, e)}
              className="p-1.5 text-ona-muted hover:text-ona-danger transition-colors cursor-pointer"
              aria-label="Remove vehicle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Enter another vehicle button */}
        <div className="pt-1 flex justify-center">
          <button
            type="button"
            onClick={() => setShowSheet(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-ona-border text-xs font-semibold text-ona-ink hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Enter another vehicle
          </button>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer ${
            isValid
              ? "bg-brand hover:opacity-90 text-white active:scale-[0.99]"
              : "bg-brand/50 text-white cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>

      {/* Enter Vehicle Modal Sheet */}
      <EnterVehicleSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        onSave={handleAddVehicle}
      />
    </div>
  );
}
