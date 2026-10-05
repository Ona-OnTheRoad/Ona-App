"use client";

import { useMemo, useState } from "react";
import {
  formatVehicleLabel,
  profileVehiclesOf,
} from "@/components/home/job-vehicle-helpers";
import { useApp } from "@/lib/store";
import type { MotoristVehicle } from "@/lib/types";

/** Profile vehicles + vehicles saved in this session (deduped by label). */
export function useSavedVehicles() {
  const { userProfile, updateUserProfile } = useApp();
  const [manualVehicles, setManualVehicles] = useState<MotoristVehicle[]>([]);

  const profileVehicles = useMemo(
    () => profileVehiclesOf(userProfile),
    [userProfile],
  );
  const savedVehicles = useMemo(
    () => [
      ...profileVehicles,
      ...manualVehicles.filter(
        (mv) =>
          !profileVehicles.some(
            (pv) => formatVehicleLabel(pv) === formatVehicleLabel(mv),
          ),
      ),
    ],
    [profileVehicles, manualVehicles],
  );

  const saveVehicle = (v: MotoristVehicle): string | null => {
    setManualVehicles((prev) => [...prev, v]);
    if (userProfile) {
      updateUserProfile({ vehicles: [...(userProfile.vehicles ?? []), v] });
    }
    return null;
  };

  return { manualVehicles, setManualVehicles, savedVehicles, saveVehicle };
}
