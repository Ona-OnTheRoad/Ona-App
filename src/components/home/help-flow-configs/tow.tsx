import { Check } from "lucide-react";
import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PRO_SERVICE_LABELS } from "@/lib/pro-service-id";
import {
  towScreen,
  nextTowScreen,
  composeTowProblem,
  canAdvanceText as towCanAdvance,
  TOW_START_OPTIONS,
  TOW_MAX_PHOTOS,
  TOW_MIN_PHOTOS,
  TOW_FINAL_COPY,
  resolveTowRoute,
  applyTowConfirmChoice,
  confirmQuestion as towConfirmQuestion,
  canFindTowPro,
  type TowRoute,
} from "@/lib/tow/question-tree";
import { makeUrgencyChips } from "./helpers";
import type { ScreenFn, NextScreenFn, CanAdvanceTextFn, ComposeProblemFn, ResolveRouteFn, ApplyConfirmFn, ConfirmQuestionFn, HelpFlowConfig } from "./types";

export const towConfig: HelpFlowConfig = {
  sessionKey: "ona-tow-flow-session",
  screen: towScreen as ScreenFn,
  nextScreen: nextTowScreen as NextScreenFn,
  canAdvanceText: towCanAdvance as CanAdvanceTextFn,
  composeProblem: composeTowProblem as ComposeProblemFn,
  startOptions: TOW_START_OPTIONS,
  resolveRoute: resolveTowRoute as unknown as ResolveRouteFn,
  applyConfirmChoice: applyTowConfirmChoice as unknown as ApplyConfirmFn,
  confirmQuestion: towConfirmQuestion as unknown as ConfirmQuestionFn,
  hasVehicleStep: true,
  defaultStack: ["vehicle"],
  defaultTrade: "towing",
  nearestProServices: ["towing"],
  urgencyChips: makeUrgencyChips(TOW_FINAL_COPY),
  maxPhotos: TOW_MAX_PHOTOS,
  minPhotos: TOW_MIN_PHOTOS,
  finalSteps: ["urgency", "photos", "voice", "location", "destination", "colour", "meetPro"],
  finalCopy: {
    urgency: TOW_FINAL_COPY.urgency,
    photos: TOW_FINAL_COPY.photos,
    voice: TOW_FINAL_COPY.voice,
    location: TOW_FINAL_COPY.location,
    destination: TOW_FINAL_COPY.destination,
    colour: TOW_FINAL_COPY.colour,
    meetPro: TOW_FINAL_COPY.meetPro,
  },
  progressDefaultTotal: 13,
  sendLabel: "Find a Tow Pro",
  busyLabel: "Finding help",
  buildPayload: (ctx) => {
    const meetPro = (ctx.extraState.meetPro as "yes" | "no" | null) ?? null;
    const meetProTrade = (ctx.extraState.meetProTrade as ProService | null) ?? null;
    const destination = (ctx.extraState.destination as string) ?? "";
    const colour = (ctx.extraState.colour as string) ?? "";
    const problem = [
      composeTowProblem(ctx.answers, ctx.extra, ctx.landmark, { destination, colour }),
      meetPro === "yes" && meetProTrade
        ? `Also send a ${PRO_SERVICE_LABELS[meetProTrade]} to meet me at the destination.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    return {
      serviceType: "towing",
      problem,
      motoristVehicle: ctx.vehicleLabel || null,
      extraPayload: {
        meetPro: meetPro === "yes",
        meetProTrade: meetPro === "yes" ? meetProTrade : null,
      },
    };
  },
  computeCanSend: ({ finalStep, photos, extraState }) => {
    if (!canFindTowPro(photos.length)) return false;
    if (finalStep === "meetPro") {
      const meetPro = (extraState.meetPro as "yes" | "no" | null) ?? null;
      const meetProTrade = extraState.meetProTrade as ProService | null;
      return meetPro === "no" || (meetPro === "yes" && meetProTrade !== null);
    }
    return true;
  },
  restoreExtraSnapshot: (snap, setExtraState) => {
    setExtraState({
      destination: (snap as Record<string, unknown>).destination ?? "",
      colour: (snap as Record<string, unknown>).colour ?? "",
      meetPro: (snap as Record<string, unknown>).meetPro ?? null,
      meetProTrade: (snap as Record<string, unknown>).meetProTrade ?? null,
    });
  },
  collectExtraSnapshot: (state) => ({
    destination: state.destination,
    colour: state.colour,
    meetPro: state.meetPro,
    meetProTrade: state.meetProTrade,
  }),
  renderExtraFinalStep: ({
    finalStep,
    extraState,
    setExtraState,
    setError,
    isLight,
    ink,
    muted,
    field,
    rowCard,
    chipIdle,
    actionFlat,
  }) => {
    if (finalStep === "destination") {
      return (
        <input
          value={(extraState.destination as string) ?? ""}
          onChange={(e) => {
            setExtraState({ ...extraState, destination: e.target.value });
            setError(null);
          }}
          placeholder="Workshop name or area"
          className={cn(
            "w-full rounded-xl border-0 px-3 py-2 text-[13px] font-medium outline-none",
            field,
          )}
        />
      );
    }
    if (finalStep === "colour") {
      return (
        <input
          value={(extraState.colour as string) ?? ""}
          onChange={(e) => {
            setExtraState({ ...extraState, colour: e.target.value });
            setError(null);
          }}
          placeholder="e.g. Black, Silver, Red"
          className={cn(
            "w-full rounded-xl border-0 px-3 py-2 text-[13px] font-medium outline-none",
            field,
          )}
        />
      );
    }
    if (finalStep === "meetPro") {
      const meetPro = (extraState.meetPro as "yes" | "no" | null) ?? null;
      const meetProTrade = (extraState.meetProTrade as ProService | null) ?? null;
      const MEET_PRO_OPTIONS: ProService[] = [
        "mechanic", "vulcanizer", "body", "battery", "electrical", "ac",
      ];
      return (
        <div className="space-y-2">
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setExtraState({ ...extraState, meetPro: "yes" });
              }}
              className="flex w-full items-center gap-2 rounded-[4px] border-0 px-1 py-3 text-left transition-transform duration-150 active:scale-[0.985]"
            >
              <span className={cn("text-[13px] font-semibold", ink)}>
                {TOW_FINAL_COPY.meetProYes}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setExtraState({ ...extraState, meetPro: "no", meetProTrade: null });
              }}
              className="flex w-full items-center gap-2 rounded-[4px] border-0 px-1 py-3 text-left transition-transform duration-150 active:scale-[0.985]"
            >
              <span className={cn("text-[13px] font-semibold", ink)}>
                {TOW_FINAL_COPY.meetProNo}
              </span>
            </button>
          </div>
          {meetPro === "yes" ? (
            <div className="pt-1">
              <p className={cn("pb-1 text-[12px] font-bold", ink)}>
                Select the repair pro to meet you
              </p>
              <div className="flex flex-col gap-1">
                {MEET_PRO_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setExtraState({ ...extraState, meetProTrade: t });
                      setError(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-[4px] border-0 px-1 py-3 text-left transition-transform duration-150 active:scale-[0.985]",
                      rowCard,
                    )}
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[13px] font-semibold capitalize leading-snug",
                        meetProTrade === t ? "text-[#FF6B35]" : ink,
                      )}
                    >
                      {PRO_SERVICE_LABELS[t]}
                    </span>
                    {meetProTrade === t ? (
                      <Check className="h-4 w-4 shrink-0 text-[#FF6B35]" strokeWidth={2.5} />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      );
    }
    return null;
  },
};
