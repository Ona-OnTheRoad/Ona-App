import {
  isAgreedPastPaymentDeadline,
  isAgreedPastPayToBookDeadline,
  isBookedPastCompletionDeadline,
  isCompletedPastAutoReleaseDeadline,
  isNegotiationTimerArmed,
} from "@/lib/jobs/constants";
import { recordJobDiagnostic } from "@/lib/jobs/diagnostics/collector";
import type { DiagnosticContext, JobResource } from "@/lib/jobs/diagnostics/types";
import type { JobRecord } from "@/lib/jobs/types";

export const EXPIRE_STALE_ROUTINE_COOLDOWN_MS = 120_000;
export const EXPIRE_STALE_URGENT_COOLDOWN_MS = 45_000;
export const PAIRING_SWEEP_COOLDOWN_MS = 5_000;

export const EXPIRE_STALE_STORAGE_KEY = "ona:maintenance:expire-stale";
export const PAIRING_SWEEP_STORAGE_KEY = "ona:maintenance:pairing-sweep";
const MAX_FUTURE_SKEW_MS = 5 * 60_000;

export interface MaintenanceOptions {
  urgent?: boolean;
  force?: boolean;
}

export type CoordinatedResult<T> =
  | { ok: true; data: T; skipped?: boolean; coalesced?: boolean }
  | { ok: false; status?: number; code?: string; message: string };

interface LaneState<T> {
  inFlight: Promise<CoordinatedResult<T>> | null;
  lastRunAt: number;
  storageKey: string;
}

const expireStaleLane: LaneState<{
  checked: number;
  cancelled: number;
  ids: string[];
}> = {
  inFlight: null,
  lastRunAt: 0,
  storageKey: EXPIRE_STALE_STORAGE_KEY,
};

const pairingSweepLane: LaneState<{
  checked: number;
  timedOut: number;
  expired: number;
}> = {
  inFlight: null,
  lastRunAt: 0,
  storageKey: PAIRING_SWEEP_STORAGE_KEY,
};

function readSharedLastRunAt<T>(lane: LaneState<T>, now: number): number {
  let latest = lane.lastRunAt;
  if (typeof window === "undefined") return latest;
  try {
    const raw = window.localStorage?.getItem(lane.storageKey);
    if (!raw) return latest;
    const parsed = Number(raw);
    if (
      Number.isFinite(parsed) &&
      parsed > 0 &&
      parsed <= now + MAX_FUTURE_SKEW_MS
    ) {
      latest = Math.max(latest, parsed);
    }
  } catch {
    /* ignore storage access errors */
  }
  return latest;
}

function writeSharedLastRunAt<T>(lane: LaneState<T>, now: number): void {
  lane.lastRunAt = now;
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(lane.storageKey, String(now));
  } catch {
    /* ignore storage quota/access errors */
  }
}

async function runCoordinated<T>(
  resource: Extract<JobResource, "expire-stale" | "pairing-sweep">,
  lane: LaneState<T>,
  cooldownMs: number,
  skippedData: T,
  context: DiagnosticContext,
  options: MaintenanceOptions | undefined,
  fetcher: () => Promise<CoordinatedResult<T>>,
): Promise<CoordinatedResult<T>> {
  if (lane.inFlight) {
    recordJobDiagnostic("refresh", resource, context, "coalesced");
    const shared = await lane.inFlight;
    return shared.ok ? { ...shared, coalesced: true } : shared;
  }

  const now = Date.now();
  const lastRunAt = readSharedLastRunAt(lane, now);
  if (!options?.force && lastRunAt > 0 && now - lastRunAt < cooldownMs) {
    recordJobDiagnostic("refresh", resource, context, "skipped");
    return { ok: true, data: skippedData, skipped: true };
  }

  let promise: Promise<CoordinatedResult<T>> | null = null;
  promise = (async (): Promise<CoordinatedResult<T>> => {
    try {
      const result = await fetcher();
      if (result.ok) {
        writeSharedLastRunAt(lane, Date.now());
      }
      return result;
    } finally {
      if (lane.inFlight === promise) {
        lane.inFlight = null;
      }
    }
  })();

  lane.inFlight = promise;
  return promise;
}

export function coordinateExpireStale(
  context: DiagnosticContext,
  options: MaintenanceOptions | undefined,
  fetcher: () => Promise<
    CoordinatedResult<{ checked: number; cancelled: number; ids: string[] }>
  >,
) {
  const cooldownMs = options?.urgent
    ? EXPIRE_STALE_URGENT_COOLDOWN_MS
    : EXPIRE_STALE_ROUTINE_COOLDOWN_MS;
  return runCoordinated(
    "expire-stale",
    expireStaleLane,
    cooldownMs,
    { checked: 0, cancelled: 0, ids: [] },
    context,
    options,
    fetcher,
  );
}

export function coordinatePairingSweep(
  context: DiagnosticContext,
  options: MaintenanceOptions | undefined,
  fetcher: () => Promise<
    CoordinatedResult<{ checked: number; timedOut: number; expired: number }>
  >,
) {
  return runCoordinated(
    "pairing-sweep",
    pairingSweepLane,
    PAIRING_SWEEP_COOLDOWN_MS,
    { checked: 0, timedOut: 0, expired: 0 },
    context,
    options,
    fetcher,
  );
}

export function isJobPendingPayoutSettlement(
  job: Pick<JobRecord, "status" | "escrowStatus"> | null | undefined,
): boolean {
  if (!job) return false;
  return (
    job.status === "satisfied" ||
    job.escrowStatus === "pending_settlement" ||
    job.escrowStatus === "release_pending"
  );
}

/**
 * True when the job is in a non-terminal state (or has pending settlement)
 * where background expire-stale maintenance can meaningfully progress it.
 */
export function jobNeedsMaintenanceSweep(
  job: JobRecord | null | undefined,
): boolean {
  if (!job) return false;
  if (isJobPendingPayoutSettlement(job)) return true;
  if (
    job.status === "cancelled" ||
    job.status === "expired" ||
    job.status === "released" ||
    job.status === "refunded"
  ) {
    return false;
  }
  return true;
}

/**
 * True when the job has a maintenance deadline or pending settlement that is
 * already due/overdue right now, warranting an immediate sweep rather than
 * waiting for the background interval.
 */
export function jobNeedsImmediateMaintenanceSweep(
  job: JobRecord | null | undefined,
): boolean {
  if (!job) return false;
  if (isJobPendingPayoutSettlement(job)) return true;
  if (
    isAgreedPastPayToBookDeadline(job) ||
    isAgreedPastPaymentDeadline(job) ||
    isBookedPastCompletionDeadline(job) ||
    isCompletedPastAutoReleaseDeadline(job)
  ) {
    return true;
  }
  if (job.status === "scheduled" && job.scheduledDispatchAt) {
    const at = Date.parse(job.scheduledDispatchAt);
    if (Number.isFinite(at) && !job.dispatchNotifiedAt && Date.now() >= at) {
      return true;
    }
  }
  if (
    !job.pairingStage &&
    (job.status === "negotiating" || job.status === "searching") &&
    !isNegotiationTimerArmed(job)
  ) {
    const baseMs = Date.parse(job.updatedAt || job.createdAt);
    if (Number.isFinite(baseMs) && Date.now() - baseMs >= 60_000) {
      return true;
    }
  }
  return false;
}

export function resetMaintenanceCoordinatorForTests(): void {
  expireStaleLane.inFlight = null;
  expireStaleLane.lastRunAt = 0;
  pairingSweepLane.inFlight = null;
  pairingSweepLane.lastRunAt = 0;
  if (typeof window !== "undefined") {
    try {
      window.localStorage?.removeItem(EXPIRE_STALE_STORAGE_KEY);
      window.localStorage?.removeItem(PAIRING_SWEEP_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
