import type { ProService } from "@/lib/types";
import type { BuildPayloadResult, ComposeProblemFn, HelpFlowConfig, UrgencyChip } from "./types";

export function makeUrgencyChips(copy: {
  normal: string;
  emergency: string;
  remote: string;
  night: string;
}): UrgencyChip[] {
  return [
    { id: "normal", label: copy.normal, fee: "1x · base + call-out" },
    { id: "emergency", label: copy.emergency, fee: "1.25x · base + call-out" },
    { id: "remote", label: copy.remote, fee: "1.35x · base + call-out" },
    { id: "night", label: copy.night, fee: "1.5x · base + call-out" },
  ];
}

/* ======================================================================== */
/*  Common buildPayload helper                                                */
/* ======================================================================== */

export function defaultBuildPayload(
  trade: ProService,
  compose: ComposeProblemFn,
  ctx: Parameters<HelpFlowConfig["buildPayload"]>[0],
): BuildPayloadResult {
  return {
    serviceType: trade,
    problem: [compose(ctx.answers, ctx.extra, ctx.landmark)]
      .filter(Boolean)
      .join("\n"),
    motoristVehicle: ctx.vehicleLabel || null,
  };
}
