import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  scanScreen,
  nextScanScreen,
  composeScanProblem,
  canAdvanceText as diagCanAdvance,
  SCAN_START_OPTIONS,
  SCAN_MAX_PHOTOS,
  SCAN_MIN_PHOTOS,
  SCAN_FINAL_COPY,
  resolveScanRoute,
  applyConfirmChoice as diagApplyConfirm,
  confirmQuestion as diagConfirmQuestion,
  type ScanRoute,
} from "@/lib/diagnostics/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, ResolveRouteFn, ApplyConfirmFn, ConfirmQuestionFn, HelpFlowConfig } from "./types";

export const diagnosticsConfig: HelpFlowConfig = {
  sessionKey: "ona-diagnostics-flow-session",
  screen: scanScreen as ScreenFn,
  nextScreen: nextScanScreen as NextScreenFn,
  canAdvanceText: diagCanAdvance as CanAdvanceTextFn,
  composeProblem: composeScanProblem as ComposeProblemFn,
  startOptions: SCAN_START_OPTIONS,
  resolveRoute: resolveScanRoute as unknown as ResolveRouteFn,
  applyConfirmChoice: diagApplyConfirm as unknown as ApplyConfirmFn,
  confirmQuestion: diagConfirmQuestion as unknown as ConfirmQuestionFn,
  hasVehicleStep: true,
  defaultStack: ["vehicle"],
  defaultTrade: "diagnostics",
  nearestProServices: ["diagnostics"],
  urgencyChips: makeUrgencyChips(SCAN_FINAL_COPY),
  maxPhotos: SCAN_MAX_PHOTOS,
  minPhotos: SCAN_MIN_PHOTOS,
  finalSteps: ["urgency", "photos", "voice", "location", "tow"],
  finalCopy: {
    urgency: SCAN_FINAL_COPY.urgency,
    photos: SCAN_FINAL_COPY.photos,
    voice: SCAN_FINAL_COPY.voice,
    location: SCAN_FINAL_COPY.location,
    tow: SCAN_FINAL_COPY.tow,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const towChoice = (ctx.extraState.towChoice as "tow" | "diagnostics" | null) ?? null;
    const trade: ProService = towChoice === "tow" ? "towing" : "diagnostics";
    const problem = [
      towChoice === "tow" ? "Needs the vehicle towed: Yes" : "",
      composeScanProblem(ctx.answers, ctx.extra, ctx.landmark),
    ]
      .filter(Boolean)
      .join("\n");
    return { serviceType: trade, problem, motoristVehicle: ctx.vehicleLabel || null };
  },
  computeCanSend: ({ finalStep, extraState }) => {
    if (finalStep === "tow") return (extraState.towChoice as string | null) !== null;
    return true;
  },
  restoreExtraSnapshot: (snap, setExtraState) => {
    setExtraState({
      towChoice: (snap as Record<string, unknown>).towChoice ?? null,
      towConfirming: (snap as Record<string, unknown>).towConfirming ?? false,
    });
  },
  collectExtraSnapshot: (state) => ({
    towChoice: state.towChoice,
    towConfirming: state.towConfirming,
  }),
  renderExtraFinalStep: ({
    finalStep,
    extraState,
    setExtraState,
    setError,
    ink,
    chipIdle,
    actionFlat,
  }) => {
    if (finalStep !== "tow") return null;
    const towChoice = (extraState.towChoice as "tow" | "diagnostics" | null) ?? null;
    const towConfirming = (extraState.towConfirming as boolean) ?? false;
    return (
      <div>
        <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
          {SCAN_FINAL_COPY.tow}
        </p>
        {towConfirming ? (
          <div className="mt-3">
            <p className={cn("text-[13px] font-bold", ink)}>This sounds like Tow. Continue?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { setExtraState({ ...extraState, towChoice: "tow", towConfirming: false }); setError(null); }} className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]">Yes</button>
              <button type="button" onClick={() => { setExtraState({ ...extraState, towChoice: "diagnostics", towConfirming: false }); setError(null); }} className={cn("h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>No</button>
            </div>
          </div>
        ) : towChoice === null ? (
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setExtraState({ ...extraState, towConfirming: true })} className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]">Yes</button>
            <button type="button" onClick={() => { setExtraState({ ...extraState, towChoice: "diagnostics" }); setError(null); }} className={cn("h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>No</button>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={cn("text-[13px] font-bold", ink)}>{towChoice === "tow" ? "Dispatch as: Tow" : "Dispatch as: Diagnostics"}</span>
            <button type="button" onClick={() => setExtraState({ ...extraState, towChoice: null, towConfirming: false })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
          </div>
        )}
      </div>
    );
  },
};
