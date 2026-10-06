import { cn } from "@/lib/utils";
import {
  genScreen,
  nextGeneratorScreen,
  composeGeneratorProblem,
  canAdvanceText as genCanAdvance,
  GEN_START_OPTIONS,
  GEN_MAX_PHOTOS,
  GEN_MIN_PHOTOS,
  GEN_FINAL_COPY,
  GEN_SUPPLY_OPTIONS,
  resolveGeneratorRoute,
  applyConfirmChoice as genApplyConfirm,
  confirmQuestion as genConfirmQuestion,
  type GenRoute,
} from "@/lib/generator/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, ResolveRouteFn, ApplyConfirmFn, ConfirmQuestionFn, HelpFlowConfig } from "./types";

export const generatorConfig: HelpFlowConfig = {
  sessionKey: "ona-generator-flow-session",
  screen: genScreen as ScreenFn,
  nextScreen: nextGeneratorScreen as NextScreenFn,
  canAdvanceText: genCanAdvance as CanAdvanceTextFn,
  composeProblem: composeGeneratorProblem as ComposeProblemFn,
  startOptions: GEN_START_OPTIONS,
  resolveRoute: resolveGeneratorRoute as unknown as ResolveRouteFn,
  applyConfirmChoice: genApplyConfirm as unknown as ApplyConfirmFn,
  confirmQuestion: genConfirmQuestion as unknown as ConfirmQuestionFn,
  hasVehicleStep: false,
  defaultStack: ["machine"],
  defaultTrade: "generator",
  nearestProServices: ["generator"],
  urgencyChips: makeUrgencyChips(GEN_FINAL_COPY),
  maxPhotos: GEN_MAX_PHOTOS,
  minPhotos: GEN_MIN_PHOTOS,
  finalSteps: ["urgency", "photos", "voice", "location", "material"],
  finalCopy: {
    urgency: GEN_FINAL_COPY.urgency,
    photos: GEN_FINAL_COPY.photos,
    voice: GEN_FINAL_COPY.voice,
    location: GEN_FINAL_COPY.location,
    material: GEN_FINAL_COPY.size,
  },
  progressDefaultTotal: 12,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const supplyChoice = (ctx.extraState.supplyChoice as string) ?? null;
    const size = (ctx.extraState.size as string) ?? "";
    const supplyLabel =
      GEN_SUPPLY_OPTIONS.find((o) => o.id === supplyChoice)?.label ||
      supplyChoice ||
      "";
    const problem = [
      size.trim() ? `${GEN_FINAL_COPY.size} ${size.trim()}` : "",
      supplyLabel ? `${GEN_FINAL_COPY.supply} ${supplyLabel}` : "",
      composeGeneratorProblem(ctx.answers, ctx.extra, ctx.landmark),
    ]
      .filter(Boolean)
      .join("\n");
    return { serviceType: "generator", problem, motoristVehicle: null };
  },
  computeCanSend: ({ finalStep, extraState, photos }) => {
    if (photos.length < GEN_MIN_PHOTOS) return false;
    if (finalStep === "material") {
      const supplyChoice = extraState.supplyChoice as string | null;
      const size = (extraState.size as string) ?? "";
      return supplyChoice !== null && size.trim().length > 0;
    }
    return true;
  },
  restoreExtraSnapshot: (snap, setExtraState) => {
    setExtraState({
      size: (snap as Record<string, unknown>).size ?? "",
      supplyChoice: (snap as Record<string, unknown>).supplyChoice ?? null,
    });
  },
  collectExtraSnapshot: (state) => ({
    size: state.size,
    supplyChoice: state.supplyChoice,
  }),
  renderExtraFinalStep: ({
    finalStep,
    extraState,
    setExtraState,
    setError,
    ink,
    field,
    chipIdle,
    actionFlat,
  }) => {
    if (finalStep !== "material") return null;
    const size = (extraState.size as string) ?? "";
    const supplyChoice = (extraState.supplyChoice as string) ?? null;
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
            {GEN_FINAL_COPY.size}
          </p>
          <textarea
            value={size}
            onChange={(e) => { setExtraState({ ...extraState, size: e.target.value }); setError(null); }}
            rows={2}
            placeholder="e.g. Diesel 7.5kVA"
            className={cn("mt-1 w-full resize-none rounded-xl border-0 px-3 py-2 text-[13px] font-medium leading-snug outline-none", field)}
          />
        </div>
        <div>
          <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
            {GEN_FINAL_COPY.supply}
          </p>
          {supplyChoice === null ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {GEN_SUPPLY_OPTIONS.map((opt) => (
                <button key={opt.id} type="button" onClick={() => { setExtraState({ ...extraState, supplyChoice: opt.id }); setError(null); }} className={cn("h-11 rounded-md border-0 text-[13px] font-bold active:scale-[0.985]", chipIdle)}>
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={cn("text-[13px] font-bold", ink)}>
                {GEN_SUPPLY_OPTIONS.find((o) => o.id === supplyChoice)?.label ?? supplyChoice}
              </span>
              <button type="button" onClick={() => setExtraState({ ...extraState, supplyChoice: null })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
            </div>
          )}
        </div>
      </div>
    );
  },
};
