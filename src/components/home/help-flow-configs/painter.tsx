import { cn } from "@/lib/utils";
import {
  painterScreen,
  nextPainterScreen,
  composePainterJob,
  canAdvanceText as paintCanAdvance,
  PAINTER_START_OPTIONS,
  PAINTER_MAX_PHOTOS,
  PAINTER_MIN_PHOTOS,
  PAINTER_FINAL_COPY,
  PAINTER_SUPPLY_OPTIONS,
  PAINTER_SCAFFOLD_OPTIONS,
} from "@/lib/painter/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, HelpFlowConfig } from "./types";

export const painterConfig: HelpFlowConfig = {
  sessionKey: "ona-painter-flow-session",
  screen: painterScreen as ScreenFn,
  nextScreen: nextPainterScreen as NextScreenFn,
  canAdvanceText: paintCanAdvance as CanAdvanceTextFn,
  composeProblem: composePainterJob as ComposeProblemFn,
  startOptions: PAINTER_START_OPTIONS,
  hasVehicleStep: false,
  defaultStack: ["start"],
  defaultTrade: "painter",
  nearestProServices: ["painter"],
  urgencyChips: makeUrgencyChips(PAINTER_FINAL_COPY),
  maxPhotos: PAINTER_MAX_PHOTOS,
  minPhotos: PAINTER_MIN_PHOTOS,
  finalSteps: ["urgency", "photos", "voice", "location", "material"],
  finalCopy: {
    urgency: PAINTER_FINAL_COPY.urgency,
    photos: PAINTER_FINAL_COPY.photos,
    voice: PAINTER_FINAL_COPY.voice,
    location: PAINTER_FINAL_COPY.location,
    material: PAINTER_FINAL_COPY.supply,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const supplyChoice = (ctx.extraState.supplyChoice as string) ?? null;
    const scaffoldChoice = (ctx.extraState.scaffoldChoice as string) ?? null;
    const supplyLabel =
      PAINTER_SUPPLY_OPTIONS.find((o) => o.id === supplyChoice)?.label ||
      supplyChoice ||
      "";
    const scaffoldLabel =
      PAINTER_SCAFFOLD_OPTIONS.find((o) => o.id === scaffoldChoice)?.label ||
      scaffoldChoice ||
      "";
    const problem = [
      supplyLabel ? `${PAINTER_FINAL_COPY.supply} ${supplyLabel}` : "",
      scaffoldLabel ? `${PAINTER_FINAL_COPY.scaffold} ${scaffoldLabel}` : "",
      composePainterJob(ctx.answers, ctx.extra, ctx.landmark),
    ]
      .filter(Boolean)
      .join("\n");
    return { serviceType: "painter", problem, motoristVehicle: null };
  },
  computeCanSend: ({ finalStep, extraState, photos }) => {
    if (photos.length < PAINTER_MIN_PHOTOS) return false;
    if (finalStep === "material") {
      return (extraState.supplyChoice as string | null) !== null &&
        (extraState.scaffoldChoice as string | null) !== null;
    }
    return true;
  },
  restoreExtraSnapshot: (snap, setExtraState) => {
    setExtraState({
      supplyChoice: (snap as Record<string, unknown>).supplyChoice ?? null,
      scaffoldChoice: (snap as Record<string, unknown>).scaffoldChoice ?? null,
    });
  },
  collectExtraSnapshot: (state) => ({
    supplyChoice: state.supplyChoice,
    scaffoldChoice: state.scaffoldChoice,
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
    if (finalStep !== "material") return null;
    const supplyChoice = (extraState.supplyChoice as string) ?? null;
    const scaffoldChoice = (extraState.scaffoldChoice as string) ?? null;
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
            {PAINTER_FINAL_COPY.supply}
          </p>
          {supplyChoice === null ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PAINTER_SUPPLY_OPTIONS.map((opt) => (
                <button key={opt.id} type="button" onClick={() => { setExtraState({ ...extraState, supplyChoice: opt.id }); setError(null); }} className={cn("h-11 rounded-md border-0 text-[13px] font-bold active:scale-[0.985]", chipIdle)}>
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={cn("text-[13px] font-bold", ink)}>
                {PAINTER_SUPPLY_OPTIONS.find((o) => o.id === supplyChoice)?.label ?? supplyChoice}
              </span>
              <button type="button" onClick={() => setExtraState({ ...extraState, supplyChoice: null })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
            </div>
          )}
        </div>
        <div>
          <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
            {PAINTER_FINAL_COPY.scaffold}
          </p>
          {scaffoldChoice === null ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PAINTER_SCAFFOLD_OPTIONS.map((opt) => (
                <button key={opt.id} type="button" onClick={() => { setExtraState({ ...extraState, scaffoldChoice: opt.id }); setError(null); }} className={cn("h-11 rounded-md border-0 text-[13px] font-bold active:scale-[0.985]", chipIdle)}>
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={cn("text-[13px] font-bold", ink)}>
                {PAINTER_SCAFFOLD_OPTIONS.find((o) => o.id === scaffoldChoice)?.label ?? scaffoldChoice}
              </span>
              <button type="button" onClick={() => setExtraState({ ...extraState, scaffoldChoice: null })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
            </div>
          )}
        </div>
      </div>
    );
  },
};
