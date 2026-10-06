import { cn } from "@/lib/utils";
import {
  fashionScreen,
  nextFashionScreen,
  composeFashionProblem,
  canAdvanceText as fashCanAdvance,
  FASHION_START_OPTIONS,
  FASHION_MAX_PHOTOS,
  FASHION_MIN_PHOTOS,
  FASHION_FINAL_COPY,
} from "@/lib/fashion/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, HelpFlowConfig } from "./types";

export const fashionConfig: HelpFlowConfig = {
  sessionKey: "ona-fashion-flow-session",
  screen: fashionScreen as ScreenFn,
  nextScreen: nextFashionScreen as NextScreenFn,
  canAdvanceText: fashCanAdvance as CanAdvanceTextFn,
  composeProblem: composeFashionProblem as ComposeProblemFn,
  startOptions: FASHION_START_OPTIONS,
  hasVehicleStep: false,
  defaultStack: ["start"],
  defaultTrade: "fashion",
  nearestProServices: ["fashion"],
  urgencyChips: makeUrgencyChips(FASHION_FINAL_COPY),
  maxPhotos: FASHION_MAX_PHOTOS,
  minPhotos: FASHION_MIN_PHOTOS,
  finalSteps: ["urgency", "photos", "voice", "location", "home"],
  finalCopy: {
    urgency: FASHION_FINAL_COPY.urgency,
    photos: FASHION_FINAL_COPY.photos,
    voice: FASHION_FINAL_COPY.voice,
    location: FASHION_FINAL_COPY.location,
    home: FASHION_FINAL_COPY.home,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const homeChoice = (ctx.extraState.homeChoice as "home" | "visit" | null) ?? null;
    const problem = [
      homeChoice === "home" ? "Will come to your location: Yes" : "",
      composeFashionProblem(ctx.answers, ctx.extra, ctx.landmark),
    ]
      .filter(Boolean)
      .join("\n");
    return { serviceType: "fashion", problem, motoristVehicle: null };
  },
  computeCanSend: ({ finalStep, extraState, photos }) => {
    if (photos.length < FASHION_MIN_PHOTOS) return false;
    if (finalStep === "home") return (extraState.homeChoice as string | null) !== null;
    return true;
  },
  restoreExtraSnapshot: (snap, setExtraState) => {
    setExtraState({
      homeChoice: (snap as Record<string, unknown>).homeChoice ?? null,
    });
  },
  collectExtraSnapshot: (state) => ({
    homeChoice: state.homeChoice,
  }),
  renderExtraFinalStep: ({
    finalStep,
    extraState,
    setExtraState,
    setError,
    ink,
    chipIdle,
  }) => {
    if (finalStep !== "home") return null;
    const homeChoice = (extraState.homeChoice as "home" | "visit" | null) ?? null;
    return (
      <div>
        <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
          {FASHION_FINAL_COPY.home}
        </p>
        {homeChoice === null ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setExtraState({ ...extraState, homeChoice: "home" }); setError(null); }} className={cn("h-11 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>
              I&apos;ll come to you
            </button>
            <button type="button" onClick={() => { setExtraState({ ...extraState, homeChoice: "visit" }); setError(null); }} className={cn("h-11 rounded-md border-0 text-[14px] font-bold active:scale-[0.985]", chipIdle)}>
              Come to my place
            </button>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={cn("text-[13px] font-bold", ink)}>
              {homeChoice === "home" ? "I'll come to you" : "Come to my place"}
            </span>
            <button type="button" onClick={() => setExtraState({ ...extraState, homeChoice: null })} className="border-0 text-[13px] font-bold text-slate-700">Change</button>
          </div>
        )}
      </div>
    );
  },
};
