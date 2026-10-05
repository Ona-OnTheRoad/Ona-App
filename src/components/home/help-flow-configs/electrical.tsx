import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  electricalScreen,
  nextElectricalScreen,
  composeElectricalProblem,
  canAdvanceText as elecCanAdvance,
  ELECTRICAL_START_OPTIONS,
  ELECTRICAL_MAX_PHOTOS,
  ELECTRICAL_FINAL_COPY,
} from "@/lib/electrical/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, HelpFlowConfig } from "./types";

export const electricalConfig: HelpFlowConfig = {
  sessionKey: "ona-electrical-flow-session",
  screen: electricalScreen as ScreenFn,
  nextScreen: nextElectricalScreen as NextScreenFn,
  canAdvanceText: elecCanAdvance as CanAdvanceTextFn,
  composeProblem: composeElectricalProblem as ComposeProblemFn,
  startOptions: ELECTRICAL_START_OPTIONS,
  hasVehicleStep: true,
  defaultStack: ["start"],
  defaultTrade: "electrical",
  nearestProServices: ["electrical", "towing"],
  urgencyChips: makeUrgencyChips(ELECTRICAL_FINAL_COPY),
  maxPhotos: ELECTRICAL_MAX_PHOTOS,
  minPhotos: 0,
  finalSteps: ["urgency", "photos", "voice", "location", "tow"],
  finalCopy: {
    urgency: ELECTRICAL_FINAL_COPY.urgency,
    photos: ELECTRICAL_FINAL_COPY.photos,
    voice: ELECTRICAL_FINAL_COPY.voice,
    location: ELECTRICAL_FINAL_COPY.location,
    tow: ELECTRICAL_FINAL_COPY.tow,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const towChoice = (ctx.extraState.towChoice as "tow" | "electrical" | null) ?? null;
    const trade: ProService = towChoice === "tow" ? "towing" : "electrical";
    const problem = [
      towChoice === "tow" ? "Needs the vehicle towed: Yes" : "",
      composeElectricalProblem(ctx.answers, ctx.extra, ctx.landmark),
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
    answers,
    ink,
    chipIdle,
    actionFlat,
  }) => {
    if (finalStep !== "tow") return null;
    const isVehicleBranch = answers.start === "A";
    const towChoice = (extraState.towChoice as "tow" | "electrical" | null) ?? null;
    const towConfirming = (extraState.towConfirming as boolean) ?? false;
    return (
      <div>
        <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
          {ELECTRICAL_FINAL_COPY.tow}
        </p>
        {towConfirming ? (
          <div className="mt-3">
            <p className={cn("text-[13px] font-bold", ink)}>This sounds like Tow. Continue?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { setExtraState({ ...extraState, towChoice: "tow", towConfirming: false }); setError(null); }} className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]">Yes</button>
              <button type="button" onClick={() => { setExtraState({ ...extraState, towChoice: "electrical", towConfirming: false }); setError(null); }} className={cn("h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>No</button>
            </div>
          </div>
        ) : towChoice === null ? (
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setExtraState({ ...extraState, towConfirming: true })} className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]">Yes</button>
            <button type="button" onClick={() => { setExtraState({ ...extraState, towChoice: "electrical" }); setError(null); }} className={cn("h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>No</button>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={cn("text-[13px] font-bold", ink)}>{towChoice === "tow" ? "Dispatch as: Tow" : "Dispatch as: Electric"}</span>
            <button type="button" onClick={() => setExtraState({ ...extraState, towChoice: null, towConfirming: false })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
          </div>
        )}
      </div>
    );
  },
  onPush: (next, _nextAnswers, ctx) => {
    // Electrical has vehicle step that pushes to "a_symptom" instead of "start"
    // This is handled by the onPick callback, so we don't need special push logic
    return false;
  },
};
