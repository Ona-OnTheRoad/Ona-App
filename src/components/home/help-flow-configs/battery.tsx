import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  batteryScreen,
  nextBatteryScreen,
  composeBatteryProblem,
  canAdvanceText as batCanAdvance,
  BATTERY_START_OPTIONS,
  BATTERY_MAX_PHOTOS,
  BATTERY_FINAL_COPY,
  resolveBatteryRoute,
  applyConfirmChoice as batApplyConfirm,
  confirmQuestion as batConfirmQuestion,
  type BatteryRoute,
} from "@/lib/battery/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, ResolveRouteFn, ApplyConfirmFn, ConfirmQuestionFn, HelpFlowConfig } from "./types";

export const batteryConfig: HelpFlowConfig = {
  sessionKey: "ona-battery-flow-session",
  screen: batteryScreen as ScreenFn,
  nextScreen: nextBatteryScreen as NextScreenFn,
  canAdvanceText: batCanAdvance as CanAdvanceTextFn,
  composeProblem: composeBatteryProblem as ComposeProblemFn,
  startOptions: BATTERY_START_OPTIONS,
  resolveRoute: resolveBatteryRoute as unknown as ResolveRouteFn,
  applyConfirmChoice: batApplyConfirm as unknown as ApplyConfirmFn,
  confirmQuestion: batConfirmQuestion as unknown as ConfirmQuestionFn,
  hasVehicleStep: true,
  defaultStack: ["vehicle"],
  defaultTrade: "battery",
  nearestProServices: ["battery"],
  urgencyChips: makeUrgencyChips(BATTERY_FINAL_COPY),
  maxPhotos: BATTERY_MAX_PHOTOS,
  minPhotos: 0,
  finalSteps: ["urgency", "photos", "voice", "location", "tow"],
  finalCopy: {
    urgency: BATTERY_FINAL_COPY.urgency,
    photos: BATTERY_FINAL_COPY.photos,
    voice: BATTERY_FINAL_COPY.voice,
    location: BATTERY_FINAL_COPY.location,
    tow: BATTERY_FINAL_COPY.tow,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const towChoice = (ctx.extraState.towChoice as "tow" | "battery" | null) ?? null;
    const trade: ProService = towChoice === "tow" ? "towing" : "battery";
    const problem = [
      towChoice === "tow" ? "Needs tow to a safer place or workshop: Yes" : "",
      composeBatteryProblem(ctx.answers, ctx.extra, ctx.landmark),
    ]
      .filter(Boolean)
      .join("\n");
    return { serviceType: trade, problem, motoristVehicle: ctx.vehicleLabel || null };
  },
  computeCanSend: ({ finalStep, extraState }) => {
    if (finalStep === "tow") {
      return (extraState.towChoice as string | null) !== null;
    }
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
    const towChoice = (extraState.towChoice as "tow" | "battery" | null) ?? null;
    const towConfirming = (extraState.towConfirming as boolean) ?? false;
    return (
      <div>
        <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
          {BATTERY_FINAL_COPY.tow}
        </p>
        {towConfirming ? (
          <div className="mt-3">
            <p className={cn("text-[13px] font-bold", ink)}>
              {batConfirmQuestion("towing")}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setExtraState({ ...extraState, towChoice: "tow", towConfirming: false });
                  setError(null);
                }}
                className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  setExtraState({ ...extraState, towChoice: "battery", towConfirming: false });
                  setError(null);
                }}
                className={cn("h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}
              >
                No
              </button>
            </div>
          </div>
        ) : towChoice === null ? (
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setExtraState({ ...extraState, towConfirming: true })}
              className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white active:scale-[0.985]"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setExtraState({ ...extraState, towChoice: "battery" });
                setError(null);
              }}
              className={cn("h-11 flex-1 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}
            >
              No
            </button>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={cn("text-[13px] font-bold", ink)}>
              {towChoice === "tow" ? "Dispatch as: Tow" : "Dispatch as: Battery"}
            </span>
            <button
              type="button"
              onClick={() => setExtraState({ ...extraState, towChoice: null, towConfirming: false })}
              className={cn("border-0 text-[13px] font-bold", actionFlat)}
            >
              Change
            </button>
          </div>
        )}
      </div>
    );
  },
};
