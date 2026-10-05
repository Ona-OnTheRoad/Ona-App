import { useState } from "react";
import type { MotoristVehicle } from "@/lib/types";
import {
  filterOptions,
  getAllMakes,
  getModelsForMake,
  getYearsForMakeModel,
} from "@/lib/vehicle-catalog";
import { VEHICLE_TYPES } from "@/lib/vehicle-focus";
import { isAny, type VehiclePickerKey } from "./constants";

/** Vehicles this pro can fix (Customer-style cascade list) */
export function useVehiclesCanFix() {
  const [vehiclesCanFix, setVehiclesCanFix] = useState<MotoristVehicle[]>([]);
  const [draftVehicleType, setDraftVehicleType] = useState("Any");
  const [draftMake, setDraftMake] = useState("Any");
  const [draftModel, setDraftModel] = useState("Any");
  const [draftYear, setDraftYear] = useState("Any");
  const [vehiclePicker, setVehiclePicker] = useState<VehiclePickerKey | null>(
    null,
  );
  const [vehiclePickerQuery, setVehiclePickerQuery] = useState("");

  const draftVehicleReady = !isAny(draftMake) && !isAny(draftModel);

  const closeVehiclePicker = () => {
    setVehiclePicker(null);
    setVehiclePickerQuery("");
  };
  const openVehiclePicker = (key: VehiclePickerKey) => {
    setVehiclePickerQuery("");
    setVehiclePicker(key);
  };
  const vehicleOptionsFor = (key: VehiclePickerKey): string[] => {
    if (key === "vehicleType")
      return filterOptions(
        ["Any", ...VEHICLE_TYPES.filter((t) => t !== "Any")],
        vehiclePickerQuery,
      );
    if (key === "make") {
      return filterOptions(["Any", ...getAllMakes()], vehiclePickerQuery);
    }
    if (key === "model") {
      if (isAny(draftMake)) return ["Any"];
      return filterOptions(
        ["Any", ...getModelsForMake(draftMake)],
        vehiclePickerQuery,
      );
    }
    if (isAny(draftMake) || isAny(draftModel)) return ["Any"];
    const years = getYearsForMakeModel(draftMake, draftModel);
    return filterOptions(["Any", ...years.map(String)], vehiclePickerQuery);
  };
  const applyVehiclePick = (key: VehiclePickerKey, value: string) => {
    if (key === "vehicleType") {
      setDraftVehicleType(value);
      setDraftMake("Any");
      setDraftModel("Any");
      setDraftYear("Any");
    } else if (key === "make") {
      setDraftMake(value);
      setDraftModel("Any");
      setDraftYear("Any");
    } else if (key === "model") {
      setDraftModel(value);
      setDraftYear("Any");
    } else {
      setDraftYear(value);
    }
    setVehiclePicker(null);
    setVehiclePickerQuery("");
  };
  const addVehicleCanFix = () => {
    if (!draftVehicleReady && isAny(draftMake)) return;
    const next: MotoristVehicle = {
      id: `pro-veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vehicleType: isAny(draftVehicleType)
        ? undefined
        : draftVehicleType.trim(),
      make: isAny(draftMake) ? "" : draftMake.trim(),
      model: isAny(draftModel) ? "" : draftModel.trim(),
      year: isAny(draftYear) ? undefined : draftYear.trim(),
    };
    if (!next.make && !next.model) return;
    setVehiclesCanFix((prev) => [...prev, next]);
    setDraftVehicleType("Any");
    setDraftMake("Any");
    setDraftModel("Any");
    setDraftYear("Any");
  };

  return {
    vehiclesCanFix,
    setVehiclesCanFix,
    draftVehicleType,
    draftMake,
    draftModel,
    draftYear,
    vehiclePicker,
    vehiclePickerQuery,
    setVehiclePickerQuery,
    draftVehicleReady,
    closeVehiclePicker,
    openVehiclePicker,
    vehicleOptionsFor,
    applyVehiclePick,
    addVehicleCanFix,
  };
}

export type VehiclesCanFix = ReturnType<typeof useVehiclesCanFix>;
