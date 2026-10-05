import type { JobRecord } from "@/lib/jobs/types";

/** Result shape returned by every job API wrapper used with `run()`. */
export type JobApiResult =
  { ok: true; data: { job: JobRecord } } | { ok: false; message: string };

export type JobViewer = "motorist" | "repair_pro";

export type ConfirmCancelState = { actor: JobViewer } | null;

export type TripEvent =
  "START_TRIP" | "MARK_ARRIVED" | "START_WORK" | "MARK_COMPLETED";
