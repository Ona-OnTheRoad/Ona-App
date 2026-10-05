import type { CalloutUrgencyKind } from "@/lib/callout/urgency";
import type { JobMedia } from "@/lib/jobs/types";
import type { PickedLocation } from "@/components/map/location-picker-map";
import type { MotoristVehicle, ProService } from "@/lib/types";
import type { BaseRoute } from "../help-flow-configs";

export const FLOW_SESSION_MAX_BYTES = 3_000_000;

/* -------------------------------------------------------------------------- */
/*  Flow snapshot (common fields only – extra state merged via config)        */
/* -------------------------------------------------------------------------- */

export interface FlowSnapshot {
  stack: string[];
  answers: Record<string, string>;
  vehicleLabel?: string;
  manualVehicles?: MotoristVehicle[];
  draft: string;
  route?: BaseRoute | null;
  chosenTrade?: ProService;
  urgency?: CalloutUrgencyKind;
  photos: JobMedia[];
  voiceNote: JobMedia | null;
  landmark: string;
  extra: string;
  finalStep: string;
  pickedLoc: PickedLocation | null;
  /** Extra trade-specific fields are spread at the top level. */
  [key: string]: unknown;
}

export type FlowDir = "fwd" | "back";

export interface FlowStyles {
  ink: string;
  muted: string;
  field: string;
  rowCard: string;
  actionFlat: string;
  chipIdle: string;
}
