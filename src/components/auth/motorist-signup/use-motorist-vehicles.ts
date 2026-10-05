import { useMemo, useState } from "react";
import { VEHICLE_TYPES } from "@/lib/vehicle-focus";
import type { MotoristVehicle } from "@/lib/types";

/** Optional vehicles customer can skip (other services need no car) */
export function useMotoristVehicles() {
  const [vehicles, setVehicles] = useState<MotoristVehicle[]>([]);
  const [draftVehicleType, setDraftVehicleType] = useState("");
  const [draftMake, setDraftMake] = useState("");
  const [draftModel, setDraftModel] = useState("");
  const [draftYear, setDraftYear] = useState("");

  /** Real vehicle only when make + model are chosen */
  const draftReady = Boolean(draftMake.trim() && draftModel.trim());

  const resetDraft = () => {
    setDraftVehicleType("");
    setDraftMake("");
    setDraftModel("");
    setDraftYear("");
  };

  const addDraftVehicle = (): boolean => {
    if (!draftReady) return false;
    const v: MotoristVehicle = {
      id: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vehicleType: draftVehicleType.trim() || undefined,
      make: draftMake.trim(),
      model: draftModel.trim(),
      year: draftYear.trim() || undefined,
    };
    setVehicles((prev) => [...prev, v]);
    resetDraft();
    return true;
  };

  const vehicleTypeOptions = useMemo(
    () => VEHICLE_TYPES.filter((t) => t.toLowerCase() !== "any"),
    [],
  );

  return {
    vehicles,
    setVehicles,
    draftVehicleType,
    setDraftVehicleType,
    draftMake,
    setDraftMake,
    draftModel,
    setDraftModel,
    draftYear,
    setDraftYear,
    draftReady,
    resetDraft,
    addDraftVehicle,
    vehicleTypeOptions,
  };
}

export type MotoristVehiclesState = ReturnType<typeof useMotoristVehicles>;
