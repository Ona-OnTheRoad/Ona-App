"use client";

import { cn } from "@/lib/utils";
import {
  canOpenEmergencyCard,
  type HelpStep,
} from "@/components/home/need-help-steps";

export function NeedHelpActions({
  isLight,
  step,
  needsVehicle,
  problem,
  busy,
  goBack,
  goAfterHelp,
  goToSend,
  send,
}: {
  isLight: boolean;
  step: HelpStep;
  needsVehicle: boolean;
  problem: string;
  busy: boolean;
  goBack: () => void;
  goAfterHelp: () => void;
  goToSend: () => void;
  send: () => Promise<void>;
}) {
  const nextGray = isLight
    ? "bg-[#4a4d53] text-white"
    : "bg-[#5c5c60] text-white";

  return (
    <div className="flex gap-2">
      {step !== "vehicle" && (step !== "help" || needsVehicle) ? (
        <button
          type="button"
          onClick={goBack}
          className={cn(
            "h-11 flex-1 rounded-md border-0 text-[14px] font-bold",
            nextGray,
          )}
        >
          Back
        </button>
      ) : null}
      {step === "help" ? (
        <button
          type="button"
          disabled={!canOpenEmergencyCard(problem)}
          onClick={goAfterHelp}
          className={cn(
            "h-11 w-full rounded-md border-0 text-[14px] font-bold disabled:opacity-50",
            nextGray,
          )}
        >
          Next
        </button>
      ) : null}
      {step === "urgency" ? (
        <button
          type="button"
          onClick={goToSend}
          className={cn(
            "h-11 flex-1 rounded-md border-0 text-[14px] font-bold",
            nextGray,
          )}
        >
          Next
        </button>
      ) : null}
      {step === "send" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void send()}
          className="h-11 flex-1 rounded-md border-0 bg-brand text-[14px] font-bold text-white disabled:opacity-50"
        >
          {busy ? "Finding help…" : "Find a Repair Pro"}
        </button>
      ) : null}
    </div>
  );
}
