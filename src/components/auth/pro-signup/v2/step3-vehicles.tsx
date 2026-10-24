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
    <div className="flex flex-col flex-1 px-5 pt-4 pb-6 bg-white dark:bg-[#121316]">
      {/* Title & Subtitle */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Vehicles you fix
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Add vehicle types you fix best
        </p>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {/* Any Type Card */}
        <button
          type="button"
          onClick={() => setAnyType(!anyType)}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
            anyType
              ? "border-[#FF6B35] bg-orange-50/40 dark:bg-orange-950/10 shadow-sm"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300"
          }`}
        >
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Any type
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Vehicle, Make, Model, Year
            </div>
          </div>

          {/* Radio circle */}
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              anyType
                ? "border-[#FF6B35] bg-[#FF6B35]"
                : "border-slate-300 dark:border-slate-600 bg-transparent"
            }`}
          >
            {anyType && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </button>

        {/* Added Vehicles List */}
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs"
          >
            <div className="flex items-center gap-3">
              {/* Orange circle with Car icon */}
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                <Car className="w-5 h-5 text-[#FF6B35]" />
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {v.make} {v.model}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {[v.year, v.vehicleType || "Car"].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => handleRemoveVehicle(v.id, e)}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
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
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
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
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm ${
            isValid
              ? "bg-[#FF6B35] hover:bg-[#e85a26] text-white active:scale-[0.99]"
              : "bg-[#FF6B35]/50 text-white cursor-not-allowed"
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
