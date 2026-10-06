import type React from "react";
import type { CalloutUrgencyKind } from "@/lib/callout/urgency";
import type { JobMedia } from "@/lib/jobs/types";
import type { ProService } from "@/lib/types";

export interface BaseRoute {
  trade?: ProService;
  vehicleLabel?: string;
  manualVehicles?: import("@/lib/types").MotoristVehicle[];
  route: string[];
  answers: Record<string, string>;
  urgency?: CalloutUrgencyKind;
}

export type ExtraSnapshot = Record<string, unknown>;

export type ScreenFn = (id: string) => { kind: string; label?: string; question?: string; placeholder?: string; options?: Array<{ id: string; label: string }> } | undefined;

export type NextScreenFn = (
  current: string,
  answer: string,
  answers: Record<string, string>,
) => string | null;

export type CanAdvanceTextFn = (draft: string) => boolean;

export type ComposeProblemFn = (
  answers: Record<string, string>,
  extra: string,
  landmark: string,
  options?: { destination?: string; colour?: string },
) => string;

export type ResolveRouteFn = (
  answers: Record<string, string>,
) => { trade: ProService; route: string[]; answers: Record<string, string> };

export type ApplyConfirmFn = (
  route: BaseRoute & { trade: ProService },
  yes: boolean,
) => ProService;

export type ConfirmQuestionFn = (trade: ProService) => string;

export interface UrgencyChip {
  id: CalloutUrgencyKind;
  label: string;
  fee: string;
}

export interface BuildPayloadInput {
  answers: Record<string, string>;
  extra: string;
  landmark: string;
  vehicleLabel: string;
  photos: import("@/lib/jobs/types").JobMedia[];
  voiceNote: import("@/lib/jobs/types").JobMedia | null;
  pickedLoc: import("@/components/map/location-picker-map").PickedLocation | null;
  urgency: CalloutUrgencyKind;
  extraState: ExtraSnapshot;
}

export interface BuildPayloadResult {
  serviceType: ProService;
  problem: string;
  motoristVehicle: string | null;
  extraPayload?: Record<string, unknown>;
}

export type OnPushFn = (
  next: string,
  answers: Record<string, string>,
  ctx: {
    setStack: React.Dispatch<React.SetStateAction<string[]>>;
    setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setExtraState: React.Dispatch<React.SetStateAction<ExtraSnapshot>>;
    setChosenTrade: React.Dispatch<React.SetStateAction<ProService>>;
    setFinalStep: React.Dispatch<React.SetStateAction<string>>;
    route: BaseRoute | null;
    setError?: React.Dispatch<React.SetStateAction<string | null>>;
  },
) => boolean;

export type OnAcceptRouteFn = (
  yes: boolean,
  ctx: {
    route: BaseRoute | null;
    setChosenTrade: React.Dispatch<React.SetStateAction<ProService>>;
    setFinalStep: React.Dispatch<React.SetStateAction<string>>;
    setStack: React.Dispatch<React.SetStateAction<string[]>>;
    setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setExtraState: React.Dispatch<React.SetStateAction<ExtraSnapshot>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
  },
) => boolean;

export type OnPickFn = (
  step: string,
  answer: string,
  ctx: {
    setStack: React.Dispatch<React.SetStateAction<string[]>>;
    setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  },
) => boolean;

export interface HelpFlowConfig {
  sessionKey: string;
  hasVehicleStep?: boolean;
  defaultStack: string[];
  defaultTrade: ProService;
  nearestProServices: ProService[];
  resolveRoute?: ResolveRouteFn;
  applyConfirmChoice?: ApplyConfirmFn;
  confirmQuestion?: ConfirmQuestionFn;
  confirmStage?: "primary" | "alternate";
  onPush?: OnPushFn;
  onAcceptRoute?: OnAcceptRouteFn;
  onPick?: OnPickFn;
  screen: ScreenFn;
  nextScreen: NextScreenFn;
  startOptions?: ReadonlyArray<{ id: string; label: string }>;
  urgencyChips: UrgencyChip[];
  canAdvanceText: CanAdvanceTextFn;
  composeProblem: ComposeProblemFn;
  finalSteps: string[];
  finalCopy: Record<string, string>;
  progressDefaultTotal: number;
  sendLabel: string;
  busyLabel: string;
  buildPayload: (input: BuildPayloadInput) => BuildPayloadResult;
  maxPhotos: number;
  minPhotos: number;
  computeUnsafe?: (answers: Record<string, string>) => boolean;
  computeCanSend?: (ctx: {
    finalStep: string;
    photos: import("@/lib/jobs/types").JobMedia[];
    extraState: ExtraSnapshot;
    answers: Record<string, string>;
  }) => boolean;
  renderExtraFinalStep?: (props: {
    field?: string;
    value?: string;
    onChange?: (v: string) => void;
    isLight: boolean;
    finalStep: string;
    extraState: ExtraSnapshot;
    setExtraState: React.Dispatch<React.SetStateAction<ExtraSnapshot>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    ink: string;
    muted: string;
    rowCard: string;
    chipIdle: string;
    actionFlat: string;
    answers: Record<string, string>;
  }) => React.ReactNode;
  restoreExtraSnapshot?: (
    snap: ExtraSnapshot,
    setExtraState: React.Dispatch<React.SetStateAction<ExtraSnapshot>>,
  ) => void;
  collectExtraSnapshot?: (
    state: ExtraSnapshot,
  ) => ExtraSnapshot | null;
}

/* -------------------------------------------------------------------------- */
