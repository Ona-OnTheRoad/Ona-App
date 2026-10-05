import { cn } from "@/lib/utils";
import {
  solarScreen,
  nextSolarScreen,
  composeSolarProblem,
  canAdvanceText as solarCanAdvance,
  SOLAR_START_OPTIONS,
  SOLAR_MAX_PHOTOS,
  SOLAR_MIN_PHOTOS,
  SOLAR_FINAL_COPY,
  SOLAR_SUPPLY_OPTIONS,
  resolveSolarRoute,
  applyConfirmChoice as solarApplyConfirm,
  confirmQuestion as solarConfirmQuestion,
  type SolarRoute,
} from "@/lib/solar/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, ResolveRouteFn, ApplyConfirmFn, ConfirmQuestionFn, HelpFlowConfig } from "./types";

export const solarConfig: HelpFlowConfig = {
  sessionKey: "ona-solar-flow-session",
  screen: solarScreen as ScreenFn,
  nextScreen: nextSolarScreen as NextScreenFn,
  canAdvanceText: solarCanAdvance as CanAdvanceTextFn,
  composeProblem: composeSolarProblem as ComposeProblemFn,
  startOptions: SOLAR_START_OPTIONS,
  resolveRoute: resolveSolarRoute as unknown as ResolveRouteFn,
  applyConfirmChoice: solarApplyConfirm as unknown as ApplyConfirmFn,
  confirmQuestion: solarConfirmQuestion as unknown as ConfirmQuestionFn,
  hasVehicleStep: false,
  defaultStack: ["machine"],
  defaultTrade: "solar",
  nearestProServices: ["solar"],
  urgencyChips: makeUrgencyChips(SOLAR_FINAL_COPY),
  maxPhotos: SOLAR_MAX_PHOTOS,
  minPhotos: SOLAR_MIN_PHOTOS,
  finalSteps: ["urgency", "photos", "voice", "location", "material"],
  finalCopy: {
    urgency: SOLAR_FINAL_COPY.urgency,
    photos: SOLAR_FINAL_COPY.photos,
    voice: SOLAR_FINAL_COPY.voice,
    location: SOLAR_FINAL_COPY.location,
    material: SOLAR_FINAL_COPY.load,
  },
  progressDefaultTotal: 11,
  sendLabel: "Find a Repair Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const supplyChoice = (ctx.extraState.supplyChoice as string) ?? null;
    const load = (ctx.extraState.load as string) ?? "";
    const supplyLabel =
      SOLAR_SUPPLY_OPTIONS.find((o) => o.id === supplyChoice)?.label ||
      supplyChoice ||
      "";
    const problem = [
      supplyLabel ? `${SOLAR_FINAL_COPY.supply} ${supplyLabel}` : "",
      load.trim() ? `${SOLAR_FINAL_COPY.load} ${load.trim()}` : "",
      composeSolarProblem(ctx.answers, ctx.extra, ctx.landmark),
    ]
      .filter(Boolean)
      .join("\n");
    return { serviceType: "solar", problem, motoristVehicle: null };
  },
  computeCanSend: ({ finalStep, extraState, photos }) => {
    if (photos.length < SOLAR_MIN_PHOTOS) return false;
    if (finalStep === "material") {
      const supplyChoice = extraState.supplyChoice as string | null;
      const load = (extraState.load as string) ?? "";
      return supplyChoice !== null && load.trim().length > 0;
    }
    return true;
  },
  restoreExtraSnapshot: (snap, setExtraState) => {
    setExtraState({
      load: (snap as Record<string, unknown>).load ?? "",
      supplyChoice: (snap as Record<string, unknown>).supplyChoice ?? null,
    });
  },
  collectExtraSnapshot: (state) => ({
    load: state.load,
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
    const load = (extraState.load as string) ?? "";
    const supplyChoice = (extraState.supplyChoice as string) ?? null;
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
            {SOLAR_FINAL_COPY.load}
          </p>
          <textarea
            value={load}
            onChange={(e) => { setExtraState({ ...extraState, load: e.target.value }); setError(null); }}
            rows={2}
            placeholder="e.g. Lights, TV, fridge, pumping machine"
            className={cn("mt-1 w-full resize-none rounded-xl border-0 px-3 py-2 text-[13px] font-medium leading-snug outline-none", field)}
          />
        </div>
        <div>
          <p className={cn("text-[13px] font-semibold leading-snug", ink)}>
            {SOLAR_FINAL_COPY.supply}
          </p>
          {supplyChoice === null ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SOLAR_SUPPLY_OPTIONS.map((opt) => (
                <button key={opt.id} type="button" onClick={() => { setExtraState({ ...extraState, supplyChoice: opt.id }); setError(null); }} className={cn("h-11 rounded-md border-0 text-[13px] font-bold active:scale-[0.985]", chipIdle)}>
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={cn("text-[13px] font-bold", ink)}>
                {SOLAR_SUPPLY_OPTIONS.find((o) => o.id === supplyChoice)?.label ?? supplyChoice}
              </span>
              <button type="button" onClick={() => setExtraState({ ...extraState, supplyChoice: null })} className={cn("border-0 text-[13px] font-bold", actionFlat)}>Change</button>
            </div>
          )}
        </div>
      </div>
    );
  },
};
