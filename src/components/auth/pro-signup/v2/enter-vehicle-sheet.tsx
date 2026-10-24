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
    <div className="ona2 fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-w-md mx-auto bg-ona-surface text-ona-ink rounded-t-3xl shadow-xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200 border-t border-ona-border">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1.5 rounded-full bg-ona-muted/30" />
        </div>

        {/* Header */}
        <div className="px-5 pt-1 pb-3 border-b border-ona-border">
          <h2 className="text-base font-bold text-ona-ink">
            Enter vehicle
          </h2>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4 p-5 overflow-y-auto">
          {/* Vehicle Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ona-ink">
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
              className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              chevronClassName="right-3.5 text-ona-muted"
            />
          </div>

          {/* Make */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ona-ink">
              Make
            </label>
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Search make (e.g. Toyota)"
              className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>

          {/* Model & Year in two columns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ona-ink">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Corolla"
                className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ona-ink">
                Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2018"
                className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-ona-border bg-ona-surface">
          <button
            type="button"
            disabled={!isValid}
            onClick={handleSave}
            className="w-full py-3.5 px-6 rounded-full font-semibold text-sm bg-brand hover:opacity-90 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
