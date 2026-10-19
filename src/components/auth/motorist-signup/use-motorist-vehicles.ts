import { useMemo, useState } from "react";
import { VEHICLE_TYPES } from "@/lib/vehicle-focus/vehicle-types";
import type { MotoristVehicle } from "@/lib/types";

/** Optional vehicles customer can skip (other services need no car) */
export function useMotoristVehicles() {
  const [vehicles, setVehicles] = useState<MotoristVehicle[]>([]);
  const [draftVehicleType, setDraftVehicleType] = useState("");
  const [draftMake, setDraftMake] = useState("");
  const [draftModel, setDraftModel] = useState("");
  const [draftYear, setDraftYear] = useState("");
  /** Set while the sheet edits an existing row (Save replaces it instead of adding). */
  const [editingId, setEditingId] = useState<string | null>(null);

  /** Real vehicle only when make + model are chosen */
  const draftReady = Boolean(draftMake.trim() && draftModel.trim());

  const resetDraft = () => {
    setDraftVehicleType("");
    setDraftMake("");
    setDraftModel("");
    setDraftYear("");
    setEditingId(null);
  };

  const startEdit = (v: MotoristVehicle) => {
    setEditingId(v.id);
    setDraftVehicleType(v.vehicleType ?? "");
    setDraftMake(v.make);
    setDraftModel(v.model);
    setDraftYear(v.year ?? "");
  };

  const removeEditing = () => {
    if (editingId)
      setVehicles((prev) => prev.filter((x) => x.id !== editingId));
    resetDraft();
  };

  const addDraftVehicle = (): boolean => {
    if (!draftReady) return false;
    const v: MotoristVehicle = {
      id:
        editingId ??
        `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vehicleType: draftVehicleType.trim() || undefined,
      make: draftMake.trim(),
      model: draftModel.trim(),
      year: draftYear.trim() || undefined,
    };
    setVehicles((prev) =>
      editingId ? prev.map((x) => (x.id === editingId ? v : x)) : [...prev, v],
    );
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
    editingId,
    startEdit,
    removeEditing,
    addDraftVehicle,
    vehicleTypeOptions,
  };
}

export type MotoristVehiclesState = ReturnType<typeof useMotoristVehicles>;
