"use client";

import { Button } from "@/components/ui/button";
import {
  canOpenEmergencyCard,
  type HelpStep,
} from "@/components/home/need-help-steps";

export function NeedHelpActions({
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
  return (
    <div className="flex gap-2">
      {step !== "vehicle" && (step !== "help" || needsVehicle) ? (
        <Button
          size="ona"
          variant="onaOutline"
          onClick={goBack}
          className="flex-1"
        >
          Back
        </Button>
      ) : null}
      {step === "help" ? (
        <Button
          size="ona"
          variant="ona"
          disabled={!canOpenEmergencyCard(problem)}
          onClick={goAfterHelp}
        >
          Next
        </Button>
      ) : null}
      {step === "urgency" ? (
        <Button size="ona" variant="ona" onClick={goToSend} className="flex-1">
          Next
        </Button>
      ) : null}
      {step === "send" ? (
        <Button
          size="ona"
          variant="ona"
          disabled={busy}
          busy={busy}
          onClick={() => void send()}
          className="flex-1"
        >
          {busy ? "Finding help…" : "Find a Repair Pro"}
        </Button>
      ) : null}
    </div>
  );
}
