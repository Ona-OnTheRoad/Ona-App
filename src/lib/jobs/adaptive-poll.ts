import type { JobRecord } from "@/lib/jobs/types";
import type { JobSubscriptionState } from "@/lib/supabase/shared-job-subscriptions";

type JobStatus = JobRecord["status"] | null | undefined;

const PAIRING_LIVE_STATUSES = new Set<string>([
  "waiting_for_selected",
  "selected_review",
  "sequential_pairing",
  "waiting_for_pro",
  "reserved",
]);

const NEGOTIATION_STATUSES = new Set<string>([
  "negotiating",
  "searching",
  "agreed",
]);

const ACTIVE_TRIP_STATUSES = new Set<string>([
  "paid_booked",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
]);

const SETTLEMENT_STATUSES = new Set<string>(["released", "satisfied"]);

/**
 * Nominal recovery polling interval (when realtime is not yet SUBSCRIBED,
 * reconnecting, failed, or browser is offline).
 */
export function getDegradedJobPollMs(status: JobStatus): number {
  if (!status) return 2_000;
  if (PAIRING_LIVE_STATUSES.has(status)) return 1_000;
  if (NEGOTIATION_STATUSES.has(status)) return 8_000;
  if (ACTIVE_TRIP_STATUSES.has(status)) return 15_000;
  if (SETTLEMENT_STATUSES.has(status)) return 45_000;
  return 60_000;
}

/**
 * Slower safety reconciliation interval when the shared realtime channel is
 * confirmed SUBSCRIBED (`connected`) and the browser is online.
 * Visual countdowns run locally from server deadlines (`useExactCountdown`),
 * and realtime events trigger immediate reconciliation.
 */
export function getHealthyJobPollMs(status: JobStatus): number {
  if (!status) return 2_000;
  if (PAIRING_LIVE_STATUSES.has(status)) return 10_000;
  if (NEGOTIATION_STATUSES.has(status)) return 30_000;
  if (ACTIVE_TRIP_STATUSES.has(status)) return 45_000;
  if (SETTLEMENT_STATUSES.has(status)) return 120_000;
  return 180_000;
}

/**
 * Maximum backoff ceiling per job state during consecutive read failures.
 */
export function getMaxJobPollBackoffMs(status: JobStatus): number {
  if (!status) return 16_000;
  if (PAIRING_LIVE_STATUSES.has(status)) return 8_000;
  if (NEGOTIATION_STATUSES.has(status)) return 30_000;
  if (ACTIVE_TRIP_STATUSES.has(status)) return 60_000;
  if (SETTLEMENT_STATUSES.has(status)) return 120_000;
  return 180_000;
}

/** Idle (no card on screen) incoming-request list poll when realtime is not confirmed. */
export const INCOMING_IDLE_POLL_DEGRADED_MS = 3_000;
/** Idle safety poll when the shared channel is `connected` and the browser is online. */
export const INCOMING_IDLE_POLL_HEALTHY_MS = 10_000;

/**
 * Idle poll delay for the Repair Pro incoming-request popup. Slows only while
 * realtime is confirmed healthy; `adaptiveEnabled === false` is the rollback
 * switch that restores the fixed degraded cadence.
 */
export function getIncomingIdlePollMs({
  subscriptionState,
  online = true,
  adaptiveEnabled = true,
}: {
  subscriptionState: JobSubscriptionState;
  online?: boolean;
  adaptiveEnabled?: boolean;
}): number {
  if (adaptiveEnabled && subscriptionState === "connected" && online !== false) {
    return INCOMING_IDLE_POLL_HEALTHY_MS;
  }
  return INCOMING_IDLE_POLL_DEGRADED_MS;
}

export interface AdaptiveJobPollOptions {
  status: JobStatus;
  subscriptionState: JobSubscriptionState;
  online?: boolean;
  consecutiveFailures?: number;
  /** Optional jitter ratio in [0, 0.25]. Defaults to 0 when no failure backoff is active. */
  jitterRatio?: number;
  /** Random source in [0, 1) for deterministic testing. */
  random?: () => number;
}

/**
 * Computes the next adaptive poll delay in milliseconds.
 * - Uses the slower safety interval only when `subscriptionState === "connected"`
 *   and `online !== false` and `consecutiveFailures === 0`.
 * - Otherwise starts from the degraded recovery interval and applies bounded
 *   exponential backoff (`base * 2^failures`, capped at `getMaxJobPollBackoffMs`)
 *   with optional bounded jitter when `consecutiveFailures > 0`.
 */
export function computeAdaptiveJobPollDelayMs({
  status,
  subscriptionState,
  online = true,
  consecutiveFailures = 0,
  jitterRatio = 0.15,
  random = Math.random,
}: AdaptiveJobPollOptions): number {
  const failures = Math.max(0, Math.floor(consecutiveFailures));
  const isRealtimeHealthy =
    subscriptionState === "connected" && online !== false && failures === 0;

  if (isRealtimeHealthy) {
    return getHealthyJobPollMs(status);
  }

  const baseMs = getDegradedJobPollMs(status);
  if (failures === 0) {
    return baseMs;
  }

  const capMs = Math.max(baseMs, getMaxJobPollBackoffMs(status));
  const exponent = Math.min(failures, 6);
  const backedOff = Math.min(capMs, baseMs * Math.pow(2, exponent));
  const clampedRatio = Math.max(0, Math.min(0.25, jitterRatio));
  if (clampedRatio === 0) {
    return Math.round(backedOff);
  }

  // Symmetric jitter in [1 - ratio, 1 + ratio], clamped to [baseMs, capMs]
  const unit = Math.max(0, Math.min(1, random()));
  const factor = 1 + (unit * 2 - 1) * clampedRatio;
  const jittered = Math.round(backedOff * factor);
  return Math.max(baseMs, Math.min(capMs, jittered));
}
