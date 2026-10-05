"use client";

import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { apiCreateJob } from "@/lib/jobs/client";
import type { JobMedia } from "@/lib/jobs/types";
import type { CalloutUrgencyKind } from "@/lib/callout/urgency";
import type { PickedLocation } from "@/components/map/location-picker-map";
import { clearSession } from "@/lib/session-restore";
import { useApp } from "@/lib/store";
import type { ExtraSnapshot, HelpFlowConfig } from "../help-flow-configs";

interface FlowSendArgs {
  config: HelpFlowConfig;
  answers: Record<string, string>;
  extra: string;
  landmark: string;
  vehicleLabel: string;
  photos: JobMedia[];
  voiceNote: JobMedia | null;
  pickedLoc: PickedLocation | null;
  urgency: CalloutUrgencyKind;
  extraState: ExtraSnapshot;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

/** Builds the job payload and hands it to /jobs/new (or POSTs it directly). */
export function useFlowSend({
  config,
  answers,
  extra,
  landmark,
  vehicleLabel,
  photos,
  voiceNote,
  pickedLoc,
  urgency,
  extraState,
  setBusy,
  setError,
}: FlowSendArgs) {
  const router = useRouter();
  const {
    location,
    userProfile,
    backendUserId,
    isAuthenticated,
    helpingSomeoneElse,
    helpingSomeoneLabel,
  } = useApp();

  /* ---- send ------------------------------------------------------------- */
  const send = async () => {
    if (!isAuthenticated) {
      router.push("/login/role");
      return;
    }
    const motoristId = backendUserId || userProfile?.identityId || "";
    if (!motoristId) {
      router.push("/login/role");
      return;
    }
    const { serviceType, problem, motoristVehicle, extraPayload } =
      config.buildPayload({
        answers,
        extra,
        landmark,
        vehicleLabel,
        photos,
        voiceNote,
        pickedLoc,
        urgency,
        extraState,
      });
    const payload = {
      motoristId,
      motoristName: userProfile?.fullName || "Customer",
      motoristPhoto: userProfile?.avatarUrl || null,
      serviceType,
      motoristVehicle: motoristVehicle || null,
      problem,
      emergency: urgency === "emergency",
      calloutUrgency: urgency,
      currency: "NGN",
      locationLabel: pickedLoc?.label
        ? pickedLoc.label
        : helpingSomeoneElse
          ? helpingSomeoneLabel || landmark || location.label
          : landmark.trim() || location.label,
      lat: pickedLoc?.lat ?? location.coordinates.lat,
      lng: pickedLoc?.lng ?? location.coordinates.lng,
      photos,
      voiceNote,
      ...extraPayload,
    };
    setError(null);
    let preloaded = false;
    try {
      window.sessionStorage.setItem("ona-new-request", JSON.stringify(payload));
      preloaded = true;
    } catch {
      /* fall through */
    }
    if (preloaded) {
      clearSession(config.sessionKey);
      router.replace("/jobs/new");
      return;
    }
    setBusy(true);
    const res = await apiCreateJob(payload);
    setBusy(false);
    if (!res.ok) {
      setError(res.message || "Could not send. Try again.");
      return;
    }
    try {
      window.sessionStorage.setItem(
        `ona-seed-job:${res.data.job.id}`,
        JSON.stringify(res.data.job),
      );
    } catch {
      /* ignore */
    }
    router.replace(`/jobs/${res.data.job.id}`);
    clearSession(config.sessionKey);
  };

  return { send };
}
