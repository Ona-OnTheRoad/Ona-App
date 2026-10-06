import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  bodyScreen,
  nextBodyScreen,
  composeBodyProblem,
  canAdvanceText as bodyCanAdvance,
  BODY_START_OPTIONS,
  BODY_MAX_PHOTOS,
  BODY_MIN_PHOTOS,
  BODY_FINAL_COPY,
} from "@/lib/body/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, HelpFlowConfig } from "./types";

export const bodyConfig: HelpFlowConfig = {
  sessionKey: "ona-body-flow-session",
  screen: bodyScreen as ScreenFn,
  nextScreen: nextBodyScreen as NextScreenFn,
  canAdvanceText: bodyCanAdvance as CanAdvanceTextFn,
  composeProblem: composeBodyProblem as ComposeProblemFn,
  startOptions: BODY_START_OPTIONS,
  hasVehicleStep: true,
  defaultStack: ["vehicle"],
  defaultTrade: "body",
  nearestProServices: ["body"],
  urgencyChips: makeUrgencyChips(BODY_FINAL_COPY),
  maxPhotos: BODY_MAX_PHOTOS,
  minPhotos: BODY_MIN_PHOTOS,
  finalSteps: ["urgency", "photos", "voice", "location", "tow"],
  finalCopy: {
    urgency: BODY_FINAL_COPY.urgency,
    photos: BODY_FINAL_COPY.photos,
    voice: BODY_FINAL_COPY.voice,
    location: BODY_FINAL_COPY.location,
    tow: BODY_FINAL_COPY.tow,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const towChoice = (ctx.extraState.towChoice as "tow" | "body" | null) ?? null;
    const trade: ProService = towChoice === "tow" ? "towing" : "body";
    const problem = [
      towChoice === "tow" ? "Needs the vehicle towed: Yes" : "",
      composeBodyProblem(ctx.answers, ctx.extra, ctx.landmark),
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
    const towChoice = (extraState.towChoice as "tow" | "body" | null) ?? null;
    const towConfirming = (extraState.towConfirming as boolean) ?? false;
    return (
      <div>
        <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
          {BODY_FINAL_COPY.tow}
        </p>
        {towConfirming ? (
          <div className="mt-3">
            <p className={cn("text-[13px] font-bold", ink)}>This sounds like Tow. Continue?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { setExtraState({ ...extraState, towChoice: "tow", towConfirming: false }); setError(null); }} className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]">Yes</button>
              <button type="button" onClick={() => { setExtraState({ ...extraState, towChoice: "body", towConfirming: false }); setError(null); }} className={cn("h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>No</button>
            </div>
          </div>
        ) : towChoice === null ? (
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setExtraState({ ...extraState, towConfirming: true })} className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]">Yes</button>
            <button type="button" onClick={() => { setExtraState({ ...extraState, towChoice: "body" }); setError(null); }} className={cn("h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>No</button>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={cn("text-[13px] font-bold", ink)}>{towChoice === "tow" ? "Dispatch as: Tow" : "Dispatch as: Body"}</span>
            <button type="button" onClick={() => setExtraState({ ...extraState, towChoice: null, towConfirming: false })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
          </div>
        )}
      </div>
    );
  },
};
