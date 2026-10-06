import { cn } from "@/lib/utils";
import {
  carpenterScreen,
  composeCarpenterJob,
  canAdvanceText as carpCanAdvance,
  CARPENTER_START_OPTIONS,
  CARPENTER_MAX_PHOTOS,
  CARPENTER_MIN_PHOTOS,
  CARPENTER_FINAL_COPY,
  CARPENTER_MEASUREMENTS_OPTIONS,
  nextCarpenterScreen,
} from "@/lib/carpenter/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, HelpFlowConfig } from "./types";

export const carpenterConfig: HelpFlowConfig = {
  sessionKey: "ona-carpenter-flow-session",
  screen: carpenterScreen as ScreenFn,
  nextScreen: nextCarpenterScreen as NextScreenFn,
  canAdvanceText: carpCanAdvance as CanAdvanceTextFn,
  composeProblem: composeCarpenterJob as ComposeProblemFn,
  startOptions: CARPENTER_START_OPTIONS,
  hasVehicleStep: false,
  defaultStack: ["start"],
  defaultTrade: "carpenter",
  nearestProServices: ["carpenter"],
  urgencyChips: makeUrgencyChips(CARPENTER_FINAL_COPY),
  maxPhotos: CARPENTER_MAX_PHOTOS,
  minPhotos: CARPENTER_MIN_PHOTOS,
  finalSteps: ["urgency", "photos", "voice", "location", "measurements"],
  finalCopy: {
    urgency: CARPENTER_FINAL_COPY.urgency,
    photos: CARPENTER_FINAL_COPY.photos,
    voice: CARPENTER_FINAL_COPY.voice,
    location: CARPENTER_FINAL_COPY.location,
    measurements: CARPENTER_FINAL_COPY.measurements,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const measurementsChoice = (ctx.extraState.measurementsChoice as string) ?? null;
    const measurementsLabel =
      CARPENTER_MEASUREMENTS_OPTIONS.find((o) => o.id === measurementsChoice)?.label ||
      measurementsChoice ||
      "";
    const problem = [
      measurementsLabel ? `${CARPENTER_FINAL_COPY.measurements} ${measurementsLabel}` : "",
      composeCarpenterJob(ctx.answers, ctx.extra, ctx.landmark),
    ]
      .filter(Boolean)
      .join("\n");
    return { serviceType: "carpenter", problem, motoristVehicle: null };
  },
  computeCanSend: ({ finalStep, extraState, photos }) => {
    if (photos.length < CARPENTER_MIN_PHOTOS) return false;
    if (finalStep === "measurements") return (extraState.measurementsChoice as string | null) !== null;
    return true;
  },
  restoreExtraSnapshot: (snap, setExtraState) => {
    setExtraState({
      measurementsChoice: (snap as Record<string, unknown>).measurementsChoice ?? null,
    });
  },
  collectExtraSnapshot: (state) => ({
    measurementsChoice: state.measurementsChoice,
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
    if (finalStep !== "measurements") return null;
    const measurementsChoice = (extraState.measurementsChoice as string) ?? null;
    return (
      <div>
        <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
          {CARPENTER_FINAL_COPY.measurements}
        </p>
        {measurementsChoice === null ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CARPENTER_MEASUREMENTS_OPTIONS.map((opt) => (
              <button key={opt.id} type="button" onClick={() => { setExtraState({ ...extraState, measurementsChoice: opt.id }); setError(null); }} className={cn("h-11 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={cn("text-[13px] font-bold", ink)}>
              {CARPENTER_MEASUREMENTS_OPTIONS.find((o) => o.id === measurementsChoice)?.label ?? measurementsChoice}
            </span>
            <button type="button" onClick={() => setExtraState({ ...extraState, measurementsChoice: null })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
          </div>
        )}
      </div>
    );
  },
};
