"use client";

import type { Dispatch, SetStateAction } from "react";
import { JobVehicleStep } from "@/components/home/job-vehicle-step";
import type { MotoristVehicle } from "@/lib/types";

export function FlowVehicleStep({
  isLight,
  savedVehicles,
  saveVehicle,
  vehicleLabel,
  setVehicleLabel,
  setError,
  answers,
  push,
  onBack,
}: {
  isLight: boolean;
  savedVehicles: MotoristVehicle[];
  saveVehicle: (v: MotoristVehicle) => string | null;
  vehicleLabel: string;
  setVehicleLabel: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  answers: Record<string, string>;
  push: (next: string, nextAnswers: Record<string, string>) => void;
  onBack: () => void;
}) {
  return (
    <JobVehicleStep
      isLight={isLight}
      vehicles={savedVehicles}
      label={vehicleLabel}
      onChange={(next) => {
        setVehicleLabel(next);
        setError(null);
      }}
      onPick={(next, vehicle) => {
        setVehicleLabel(next);
        setError(null);
        push("start", {
          ...answers,
          ...(vehicle?.powertrain ? { powertrain: vehicle.powertrain } : {}),
        });
      }}
      onSaveVehicle={saveVehicle}
      onBack={onBack}
    />
  );
}
