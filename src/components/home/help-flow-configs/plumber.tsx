import { cn } from "@/lib/utils";
import {
  plumberScreen,
  nextPlumberScreen,
  composePlumberProblem,
  canAdvanceText as plumCanAdvance,
  PLUMBER_START_OPTIONS,
  PLUMBER_MAX_PHOTOS,
  PLUMBER_MIN_PHOTOS,
  PLUMBER_FINAL_COPY,
  PLUMBER_PROPERTY_OPTIONS,
} from "@/lib/plumber/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, HelpFlowConfig } from "./types";

export const plumberConfig: HelpFlowConfig = {
  sessionKey: "ona-plumber-flow-session",
  screen: plumberScreen as ScreenFn,
  nextScreen: nextPlumberScreen as NextScreenFn,
  canAdvanceText: plumCanAdvance as CanAdvanceTextFn,
  composeProblem: composePlumberProblem as ComposeProblemFn,
  startOptions: PLUMBER_START_OPTIONS,
  hasVehicleStep: false,
  defaultStack: ["start"],
  defaultTrade: "plumber",
  nearestProServices: ["plumber"],
  urgencyChips: makeUrgencyChips(PLUMBER_FINAL_COPY),
  maxPhotos: PLUMBER_MAX_PHOTOS,
  minPhotos: PLUMBER_MIN_PHOTOS,
  finalSteps: ["urgency", "photos", "voice", "location", "property"],
  finalCopy: {
    urgency: PLUMBER_FINAL_COPY.urgency,
    photos: PLUMBER_FINAL_COPY.photos,
    voice: PLUMBER_FINAL_COPY.voice,
    location: PLUMBER_FINAL_COPY.location,
    property: PLUMBER_FINAL_COPY.property,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const propertyChoice = (ctx.extraState.propertyChoice as string) ?? null;
    const propertyLabel =
      PLUMBER_PROPERTY_OPTIONS.find((o) => o.id === propertyChoice)?.label ||
      propertyChoice ||
      "";
    const problem = [
      propertyLabel ? `Type of property: ${propertyLabel}` : "",
      composePlumberProblem(ctx.answers, ctx.extra, ctx.landmark),
    ]
      .filter(Boolean)
      .join("\n");
    return { serviceType: "plumber", problem, motoristVehicle: null };
  },
  computeCanSend: ({ finalStep, extraState, photos }) => {
    if (photos.length < PLUMBER_MIN_PHOTOS) return false;
    if (finalStep === "property") return (extraState.propertyChoice as string | null) !== null;
    return true;
  },
  restoreExtraSnapshot: (snap, setExtraState) => {
    setExtraState({
      propertyChoice: (snap as Record<string, unknown>).propertyChoice ?? null,
    });
  },
  collectExtraSnapshot: (state) => ({
    propertyChoice: state.propertyChoice,
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
    if (finalStep !== "property") return null;
    const propertyChoice = (extraState.propertyChoice as string) ?? null;
    return (
      <div>
        <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
          {PLUMBER_FINAL_COPY.property}
        </p>
        {propertyChoice === null ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PLUMBER_PROPERTY_OPTIONS.map((opt) => (
              <button key={opt.id} type="button" onClick={() => { setExtraState({ ...extraState, propertyChoice: opt.id }); setError(null); }} className={cn("h-11 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={cn("text-[13px] font-bold", ink)}>
              {propertyChoice === "other"
                ? "Other property type"
                : (PLUMBER_PROPERTY_OPTIONS.find((o) => o.id === propertyChoice)?.label ?? propertyChoice)}
            </span>
            <button type="button" onClick={() => setExtraState({ ...extraState, propertyChoice: null })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
          </div>
        )}
      </div>
    );
  },
};
