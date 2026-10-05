import { useMemo, useState } from "react";
import {
  formatVehicleLabel,
  profileVehiclesOf,
} from "@/components/home/job-vehicle-helpers";
import type { MotoristVehicle } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useGarageVehicles } from "./use-garage-vehicles";

type Args = {
  isAuthenticated: boolean;
  setError: (e: string | null) => void;
  startQuestions: () => void;
};

/** Vehicle step: saved/garage list, inline add-vehicle form, selection. */
export function useExpressVehicles({
  isAuthenticated,
  setError,
  startQuestions,
}: Args) {
  const { userProfile } = useApp();
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [manualVehicles, setManualVehicles] = useState<MotoristVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [draftVehicleType, setDraftVehicleType] = useState("");
  const [draftMake, setDraftMake] = useState("");
  const [draftModel, setDraftModel] = useState("");
  const [draftYear, setDraftYear] = useState("");
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  /** Continue only shows right after saving a new vehicle (select auto-proceeds). */
  const [pendingContinue, setPendingContinue] = useState(false);
  const garageVehicles = useGarageVehicles(isAuthenticated);

  const savedVehicles = useMemo(() => {
    const profile = profileVehiclesOf(userProfile);
    const all = [...profile, ...manualVehicles, ...garageVehicles];
    const seen = new Set<string>();
    const out: MotoristVehicle[] = [];
    for (const v of all) {
      const label = formatVehicleLabel(v);
      if (!label || seen.has(label)) continue;
      seen.add(label);
      out.push(v);
    }
    return out;
  }, [userProfile, manualVehicles, garageVehicles]);

  const resetDraft = () => {
    setDraftVehicleType("");
    setDraftMake("");
    setDraftModel("");
    setDraftYear("");
  };

  /** Auto-proceed on select: no Continue tap needed. */
  const selectVehicle = (label: string) => {
    setVehicleLabel(label);
    setError(null);
    startQuestions();
  };

  const cancelForm = () => {
    setShowVehicleForm(false);
    resetDraft();
    setError(null);
  };

  const saveVehicle = () => {
    const v: MotoristVehicle = {
      id: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vehicleType: draftVehicleType.trim() || undefined,
      make: draftMake.trim(),
      model: draftModel.trim(),
      year: draftYear.trim() || undefined,
    };
    setManualVehicles((prev) => [...prev, v]);
    setSelectedVehicleId(v.id!);
    setVehicleLabel(formatVehicleLabel(v));
    resetDraft();
    setShowVehicleForm(false);
    setPendingContinue(true);
    setError(null);
  };

  const openForm = () => {
    setShowVehicleForm(true);
    setError(null);
  };

  const continuePending = () => {
    setPendingContinue(false);
    startQuestions();
  };

  return {
    vehicleLabel,
    savedVehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    draft: {
      vehicleType: draftVehicleType,
      make: draftMake,
      model: draftModel,
      year: draftYear,
      setVehicleType: setDraftVehicleType,
      setMake: setDraftMake,
      setModel: setDraftModel,
      setYear: setDraftYear,
    },
    showVehicleForm,
    pendingContinue,
    selectVehicle,
    cancelForm,
    saveVehicle,
    openForm,
    continuePending,
  };
}
