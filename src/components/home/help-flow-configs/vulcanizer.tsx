import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  vulcanizerScreen,
  nextVulcanizerScreen,
  composeVulcanizerProblem,
  canAdvanceText as vulcCanAdvance,
  VULCANIZER_START_OPTIONS,
  VULCANIZER_MAX_PHOTOS,
  VULCANIZER_FINAL_COPY,
  resolveVulcanizerRoute,
  applyVulcanizerConfirmChoice,
  confirmQuestion as vulcConfirmQuestion,
  type VulcanizerRoute,
} from "@/lib/vulcanizer/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, ResolveRouteFn, ApplyConfirmFn, ConfirmQuestionFn, HelpFlowConfig } from "./types";

export const vulcanizerConfig: HelpFlowConfig = {
  sessionKey: "ona-vulc-flow-session",
  screen: vulcanizerScreen as ScreenFn,
  nextScreen: nextVulcanizerScreen as NextScreenFn,
  canAdvanceText: vulcCanAdvance as CanAdvanceTextFn,
  composeProblem: composeVulcanizerProblem as ComposeProblemFn,
  startOptions: VULCANIZER_START_OPTIONS,
  resolveRoute: resolveVulcanizerRoute as unknown as ResolveRouteFn,
  applyConfirmChoice: applyVulcanizerConfirmChoice as unknown as ApplyConfirmFn,
  confirmQuestion: vulcConfirmQuestion as unknown as ConfirmQuestionFn,
  hasVehicleStep: true,
  defaultStack: ["vehicle"],
  defaultTrade: "vulcanizer",
  nearestProServices: ["vulcanizer"],
  urgencyChips: makeUrgencyChips(VULCANIZER_FINAL_COPY),
  maxPhotos: VULCANIZER_MAX_PHOTOS,
  minPhotos: 0,
  finalSteps: ["urgency", "photos", "voice", "location", "tow"],
  finalCopy: {
    urgency: VULCANIZER_FINAL_COPY.urgency,
    photos: VULCANIZER_FINAL_COPY.photos,
    voice: VULCANIZER_FINAL_COPY.voice,
    location: VULCANIZER_FINAL_COPY.location,
    tow: VULCANIZER_FINAL_COPY.tow,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const towNeeded = (ctx.extraState.towNeeded as boolean) ?? false;
    const trade: ProService = towNeeded ? "towing" : "vulcanizer";
    const problem = [
      towNeeded ? "Needs the vehicle towed: Yes" : "",
      composeVulcanizerProblem(ctx.answers, ctx.extra, ctx.landmark),
    ]
      .filter(Boolean)
      .join("\n");
    return { serviceType: trade, problem, motoristVehicle: ctx.vehicleLabel || null };
  },
  computeCanSend: ({ finalStep, extraState }) => {
    if (finalStep === "tow") return (extraState.towNeeded as boolean) !== null;
    return true;
  },
  restoreExtraSnapshot: (snap, setExtraState) => {
    setExtraState({
      towNeeded: (snap as Record<string, unknown>).towNeeded ?? false,
      towPending: (snap as Record<string, unknown>).towPending ?? false,
    });
  },
  collectExtraSnapshot: (state) => ({
    towNeeded: state.towNeeded,
    towPending: state.towPending,
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
    const towNeeded = (extraState.towNeeded as boolean) ?? false;
    const towPending = (extraState.towPending as boolean) ?? false;
    return (
      <div>
        <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
          {VULCANIZER_FINAL_COPY.tow}
        </p>
        {towPending ? (
          <div className="mt-3">
            <p className={cn("text-[13px] font-bold", ink)}>
              {vulcConfirmQuestion("towing")}
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { setExtraState({ ...extraState, towNeeded: true, towPending: false }); setError(null); }} className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]">Yes</button>
              <button type="button" onClick={() => { setExtraState({ ...extraState, towNeeded: false, towPending: false }); setError(null); }} className={cn("h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>No</button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={cn("text-[13px] font-bold", ink)}>
              {towNeeded ? "Dispatch as: Tow" : "Dispatch as: Vulcanizer"}
            </span>
            <button type="button" onClick={() => setExtraState({ ...extraState, towNeeded: false, towPending: false })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
          </div>
        )}
      </div>
    );
  },
};
