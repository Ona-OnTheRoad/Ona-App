"use client";

import { SheetSelect } from "@/components/ui/option-sheet";
import { useState } from "react";
import type { MotoristVehicle } from "@/lib/types";

interface EnterVehicleSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (vehicle: MotoristVehicle) => void;
}

const VEHICLE_TYPES = [
  "Car",
  "SUV",
  "Van",
  "Truck",
  "Motorcycle",
  "Bus",
  "Commercial",
];

export function EnterVehicleSheet({
  open,
  onClose,
  onSave,
}: EnterVehicleSheetProps) {
  const [vehicleType, setVehicleType] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  if (!open) return null;

  const isValid = make.trim().length > 0 && model.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    const newVehicle: MotoristVehicle = {
      id: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vehicleType: vehicleType.trim() || undefined,
      make: make.trim(),
      model: model.trim(),
      year: year.trim() || undefined,
    };
    onSave(newVehicle);
    // Reset fields
    setVehicleType("");
    setMake("");
    setModel("");
    setYear("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-w-md mx-auto bg-white dark:bg-[#121316] rounded-t-3xl shadow-xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-750" />
        </div>

        {/* Header */}
        <div className="px-5 pt-1 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Enter vehicle
          </h2>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4 p-5 overflow-y-auto">
          {/* Vehicle Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Vehicle type
            </label>
            <SheetSelect
              bare
              title="Vehicle type"
              value={vehicleType}
              onChange={(v) => setVehicleType(v)}
              placeholder="Select a type"
              options={VEHICLE_TYPES.map((t) => ({
                value: String(t),
                label: t,
              }))}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              chevronClassName="right-3.5 text-slate-400"
            />
          </div>

          {/* Make */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Make
            </label>
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Search make (e.g. Toyota)"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            />
          </div>

          {/* Model & Year in two columns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Corolla"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2018"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#121316]">
          <button
            type="button"
            disabled={!isValid}
            onClick={handleSave}
            className="w-full py-3.5 px-6 rounded-full font-semibold text-sm bg-[#FF6B35] hover:bg-[#e85a26] text-white disabled:opacity-50 transition-colors shadow-sm"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
