"use client";

import { decideHelpTrade } from "@/lib/callout/dispatch-trades";
import {
  CALLOUT_URGENCY_OPTIONS,
  type CalloutUrgencyKind,
} from "@/lib/callout/urgency";
import { PRO_SERVICE_LABELS } from "@/lib/pro-service-id";
import { problemPlaceholderForTrade } from "@/lib/pricing";
import type { MotoristVehicle, ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { HelpStep } from "@/components/home/need-help-steps";
import { JobVehicleStep } from "@/components/home/job-vehicle-step";

export function NeedHelpStepBody({
  isLight,
  step,
  setStep,
  setError,
  savedVehicles,
  saveVehicle,
  vehicleLabel,
  setVehicleLabel,
  problem,
  setProblem,
  statedTrade,
  chosenTrade,
  decision,
  acceptSuggested,
  keepTappedTrade,
  urgency,
  setUrgency,
}: {
  isLight: boolean;
  step: HelpStep;
  setStep: (s: HelpStep) => void;
  setError: (e: string | null) => void;
  savedVehicles: MotoristVehicle[];
  saveVehicle: (v: MotoristVehicle) => string | null;
  vehicleLabel: string;
  setVehicleLabel: (v: string) => void;
  problem: string;
  setProblem: (v: string) => void;
  statedTrade: ProService | null;
  chosenTrade: ProService | null;
  decision: ReturnType<typeof decideHelpTrade>;
  acceptSuggested: () => void;
  keepTappedTrade: () => void;
  urgency: CalloutUrgencyKind;
  setUrgency: (u: CalloutUrgencyKind) => void;
}) {
  const ink = isLight ? "text-slate-900" : "text-white";
  const field = isLight
    ? "bg-white text-slate-900 placeholder:text-slate-400"
    : "bg-[#2c2c2e] text-white placeholder:text-white/40";
  const card = isLight ? "bg-white/80" : "bg-[#1c1c1e]";
  const chipIdle = isLight
    ? "bg-black/8 text-slate-700"
    : "bg-[#2c2c2e] text-white/75";

  return (
    <>
      {step === "vehicle" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <JobVehicleStep
            isLight={isLight}
            vehicles={savedVehicles}
            label={vehicleLabel}
            onChange={(next) => {
              setVehicleLabel(next);
              setError(null);
            }}
            onPick={(next) => {
              setVehicleLabel(next);
              setError(null);
              setStep("help");
            }}
            onSaveVehicle={saveVehicle}
          />
        </div>
      ) : null}

      {step === "help" ? (
        <div className={cn("shrink-0 rounded-xl px-3 py-2", card)}>
          <label
            htmlFor="need-help-problem"
            className={cn("block text-[13px] font-bold", ink)}
          >
            What do you need help with?
          </label>
          <textarea
            id="need-help-problem"
            value={problem}
            onChange={(e) => {
              setProblem(e.target.value);
              setError(null);
            }}
            rows={2}
            placeholder={problemPlaceholderForTrade(statedTrade)}
            className={cn(
              "mt-1 w-full resize-none rounded-xl border-0 px-2.5 py-2 text-[13px] font-medium leading-snug outline-none",
              field,
            )}
          />
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className={cn("shrink-0 rounded-xl px-3 py-2", card)}>
          <p className={cn("text-[13px] font-bold", ink)}>
            This sounds like {PRO_SERVICE_LABELS[decision.suggested]}. Continue?
          </p>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={acceptSuggested}
              className="rounded-full border-0 bg-brand px-3 py-1.5 text-[12px] font-bold text-white"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={keepTappedTrade}
              className={cn(
                "rounded-full border-0 px-3 py-1.5 text-[12px] font-bold",
                chipIdle,
              )}
            >
              No
            </button>
          </div>
        </div>
      ) : null}

      {step === "urgency" ? (
        <div className={cn("shrink-0 rounded-xl px-3 py-2", card)}>
          <p className={cn("text-[13px] font-bold", ink)}>
            How urgent is this?
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CALLOUT_URGENCY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setUrgency(opt.id)}
                className={cn(
                  "rounded-full border-0 px-3 py-1.5 text-[12px] font-bold",
                  urgency === opt.id ? "bg-brand text-white" : chipIdle,
                )}
              >
                {opt.label} {opt.multiplier === 1 ? "1x" : `${opt.multiplier}x`}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "send" ? (
        <div className={cn("shrink-0 rounded-xl px-3 py-2", card)}>
          <p className={cn("text-[13px] font-bold", ink)}>Ready to send</p>
          <p
            className={cn(
              "mt-1 text-[12px] font-medium",
              isLight ? "text-slate-600" : "text-white/55",
            )}
          >
            {
              PRO_SERVICE_LABELS[
                chosenTrade || statedTrade || decision.suggested
              ]
            }{" "}
            · {CALLOUT_URGENCY_OPTIONS.find((o) => o.id === urgency)?.label}
          </p>
        </div>
      ) : null}
    </>
  );
}
