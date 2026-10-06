"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { JobMedia } from "@/lib/jobs/types";
import type { CalloutUrgencyKind } from "@/lib/callout/urgency";
import type { PickedLocation } from "@/components/map/location-picker-map";
import { readSession, writeSession } from "@/lib/session-restore";
import type { MotoristVehicle, ProService } from "@/lib/types";
import type {
  BaseRoute,
  ExtraSnapshot,
  HelpFlowConfig,
} from "../help-flow-configs";
import {
  FLOW_SESSION_MAX_BYTES,
  type FlowDir,
  type FlowSnapshot,
} from "./types";

interface FlowSessionArgs {
  config: HelpFlowConfig;
  locationLabel: string | undefined;
  stack: string[];
  setStack: Dispatch<SetStateAction<string[]>>;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  setDir: Dispatch<SetStateAction<FlowDir>>;
  photos: JobMedia[];
  setPhotos: Dispatch<SetStateAction<JobMedia[]>>;
  voiceNote: JobMedia | null;
  setVoiceNote: Dispatch<SetStateAction<JobMedia | null>>;
  landmark: string;
  setLandmark: Dispatch<SetStateAction<string>>;
  extra: string;
  setExtra: Dispatch<SetStateAction<string>>;
  finalStep: string;
  setFinalStep: Dispatch<SetStateAction<string>>;
  pickedLoc: PickedLocation | null;
  setPickedLoc: Dispatch<SetStateAction<PickedLocation | null>>;
  vehicleLabel: string;
  setVehicleLabel: Dispatch<SetStateAction<string>>;
  manualVehicles: MotoristVehicle[];
  setManualVehicles: Dispatch<SetStateAction<MotoristVehicle[]>>;
  route: BaseRoute | null;
  setRoute: Dispatch<SetStateAction<BaseRoute | null>>;
  chosenTrade: ProService;
  setChosenTrade: Dispatch<SetStateAction<ProService>>;
  urgency: CalloutUrgencyKind;
  restoreUrgency: (u: CalloutUrgencyKind) => void;
  extraState: ExtraSnapshot;
  setExtraState: Dispatch<SetStateAction<ExtraSnapshot>>;
}

/** Restores the flow from sessionStorage once, then persists every change. */
export function useFlowSession({
  config,
  locationLabel,
  stack,
  setStack,
  answers,
  setAnswers,
  draft,
  setDraft,
  setDir,
  photos,
  setPhotos,
  voiceNote,
  setVoiceNote,
  landmark,
  setLandmark,
  extra,
  setExtra,
  finalStep,
  setFinalStep,
  pickedLoc,
  setPickedLoc,
  vehicleLabel,
  setVehicleLabel,
  manualVehicles,
  setManualVehicles,
  route,
  setRoute,
  chosenTrade,
  setChosenTrade,
  urgency,
  restoreUrgency,
  extraState,
  setExtraState,
}: FlowSessionArgs) {
  const [hydrated, setHydrated] = useState(false);
  const restoredRef = useRef(false);

  /* ---- session restore -------------------------------------------------- */
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const snap = readSession<FlowSnapshot>(config.sessionKey);
    if (snap) {
      const defaultStack = config.hasVehicleStep
        ? ["vehicle"]
        : [...config.defaultStack];
      setStack(
        Array.isArray(snap.stack) && snap.stack.length
          ? snap.stack
          : defaultStack,
      );
      setAnswers(snap.answers ?? {});
      if (config.hasVehicleStep) {
        setVehicleLabel((snap.vehicleLabel as string) ?? "");
        setManualVehicles((snap.manualVehicles as MotoristVehicle[]) ?? []);
      }
      setDraft(snap.draft ?? "");
      if (config.resolveRoute) {
        setRoute((snap.route as BaseRoute) ?? null);
        if (snap.chosenTrade) setChosenTrade(snap.chosenTrade as ProService);
      }
      if (snap.urgency) restoreUrgency(snap.urgency as CalloutUrgencyKind);
      setPhotos(snap.photos ?? []);
      setVoiceNote(snap.voiceNote ?? null);
      setLandmark((snap.landmark as string) || locationLabel || "");
      setExtra((snap.extra as string) ?? "");
      if (snap.finalStep) setFinalStep(snap.finalStep as string);
      setPickedLoc((snap.pickedLoc as PickedLocation) ?? null);
      // Restore extra trade-specific state
      if (config.restoreExtraSnapshot) {
        config.restoreExtraSnapshot(snap as ExtraSnapshot, setExtraState);
      }
      setDir("fwd");
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- session persist -------------------------------------------------- */
  useEffect(() => {
    if (!hydrated) return;
    const snap: FlowSnapshot = {
      stack,
      answers,
      draft,
      photos,
      voiceNote,
      landmark,
      extra,
      finalStep,
      pickedLoc,
    };
    if (config.hasVehicleStep) {
      snap.vehicleLabel = vehicleLabel;
      snap.manualVehicles = manualVehicles;
    }
    if (config.resolveRoute) {
      snap.route = route;
      snap.chosenTrade = chosenTrade;
    }
    snap.urgency = urgency;
    if (config.collectExtraSnapshot) {
      Object.assign(snap, config.collectExtraSnapshot(extraState));
    }
    const json = JSON.stringify(snap);
    if (json.length > FLOW_SESSION_MAX_BYTES) {
      writeSession(config.sessionKey, { ...snap, photos: [], voiceNote: null });
    } else {
      writeSession(config.sessionKey, snap);
    }
  }, [
    hydrated,
    stack,
    answers,
    draft,
    photos,
    voiceNote,
    landmark,
    extra,
    finalStep,
    pickedLoc,
    vehicleLabel,
    manualVehicles,
    route,
    chosenTrade,
    urgency,
    extraState,
  ]);
}
