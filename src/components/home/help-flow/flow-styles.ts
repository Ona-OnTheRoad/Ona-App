import { PRO_SERVICE_LABELS } from "@/lib/pro-service-id";
import type { ProService } from "@/lib/types";
import type { FlowStyles } from "./types";

/** Coral tag text, e.g. "Mechanic request" / "A/C (air conditioning) request". */
export function flowTag(trade: ProService): string {
  const label =
    trade === "ac" ? "A/C (air conditioning)" : PRO_SERVICE_LABELS[trade];
  return `${label} request`;
}

/**
 * Class tokens shared by every help-flow view. They read the `.ona2` CSS
 * variables, so light/dark both work; `isLight` is kept only so callers and
 * trade configs do not have to change.
 */
export function flowStyles(isLight: boolean): FlowStyles {
  void isLight;
  return {
    ink: "text-ona-ink",
    muted: "text-ona-muted",
    field:
      "border border-ona-border bg-ona-field text-ona-ink placeholder:text-ona-muted focus:border-ona-ink",
    rowCard: "bg-ona-field",
    actionFlat: "text-ona-ink",
    chipIdle: "bg-ona-field-strong text-ona-ink",
  };
}
