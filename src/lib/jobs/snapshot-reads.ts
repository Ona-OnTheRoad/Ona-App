import type { CalloutQuote, CalloutStatus } from "@/lib/callout/constants";
import type { JobRecord } from "@/lib/jobs/types";

/** Single-flight lanes. Only pending work is retained; no settled snapshot cache. */
export function createSnapshotReads() {
  type Readers = Map<() => boolean, () => Promise<unknown>>;
  type Pending = { readers: Readers; resolve: (v: unknown) => void;
    reject: (e: unknown) => void; promise: Promise<unknown> };
  type Flight = { promise: Promise<unknown>; readers: Readers; pending?: Pending };
  const flights = new Map<string, Flight>();
  const always = () => true;
  let active = true;
  function start(key: string, readers: Readers): Promise<unknown> {
    const flight: Flight = { readers, promise: Promise.resolve().then(() => {
      if (active) for (const [isCurrent, read] of readers) {
        if (isCurrent()) return read();
      }
      throw new Error("Snapshot scope ended");
    }) };
    flights.set(key, flight);
    const finish = () => {
      if (flights.get(key) !== flight) return;
      flights.delete(key);
      if (flight.pending) {
        const next = flight.pending;
        if (active) void start(key, next.readers).then(next.resolve, next.reject);
        else next.reject(new Error("Snapshot scope ended"));
      }
    };
    // Register cleanup before consumers, and handle both outcomes without an
    // ignored rejecting `finally` promise.
    void flight.promise.then(finish, finish);
    return flight.promise;
  }
  return {
    read<T>(key: string, read: () => Promise<T>, invalidate = false, onCoalesced?: () => void,
      isCurrent: () => boolean = always): Promise<T> {
      if (!active) return Promise.reject(new Error("Snapshot scope ended"));
      const flight = flights.get(key);
      if (!flight) return start(key, new Map([[isCurrent, read]])) as Promise<T>;
      onCoalesced?.();
      if (!invalidate) {
        flight.readers.set(isCurrent, read);
        return flight.promise as Promise<T>;
      }
      if (!flight.pending) {
        let resolve!: Pending["resolve"];
        let reject!: Pending["reject"];
        const promise = new Promise<unknown>((ok, fail) => { resolve = ok; reject = fail; });
        flight.pending = { readers: new Map(), resolve, reject, promise };
      }
      flight.pending.readers.set(isCurrent, read);
      return flight.pending.promise as Promise<T>;
    },
    dispose() { active = false; },
  };
}

/** Job-row revisions order core `service_requests` fields. */
type Versioned = { id: string; jobVersion?: number; status?: string };
export function snapshotCanReplace(
  next: Versioned, current: Versioned | null, started: Versioned | null,
): boolean {
  if (!current || current.id !== next.id) return true;
  const valid = (v: number | undefined): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
  if (valid(current.jobVersion)) {
    if (!valid(next.jobVersion)) return false;
    if (next.jobVersion !== current.jobVersion) return next.jobVersion > current.jobVersion;
    // An optimistic status can share its source row revision. Background
    // reads must not undo it; explicit mutation reconciliation can force it.
    if (next.status !== current.status) return false;
  }
  // A mutation/another read committed after this fetch began. With no strictly
  // newer durable revision, leave it in place and reconcile on the next read.
  return current === started;
}

const CALLOUT_STATUS_RANK: Record<CalloutStatus, number> = {
  PENDING: 1,
  CALCULATING: 2,
  CALCULATED: 3,
  NOT_ELIGIBLE: 4,
  LOCKED: 5,
  IN_PROGRESS: 6,
  ARRIVED: 7,
  COMPLETED: 8,
  WAIVED: 8,
  CANCELLED: 8,
  DISPUTED: 8,
};

function quoteTimestampMs(q: CalloutQuote): number {
  const iso = q.voidedAt || q.lockedAt || q.calculatedAt || q.originCapturedAt || "";
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

function isQuoteCompatibleWithJob(q: CalloutQuote | null | undefined, job: JobRecord): q is CalloutQuote {
  if (!q) return false;
  if (q.requestId && q.requestId !== job.id) return false;
  if (q.tradeId && job.serviceType && q.tradeId !== job.serviceType) return false;
  if (q.originProId && job.repairProId && q.originProId !== job.repairProId) return false;
  return true;
}

/**
 * Picks the more authoritative call-out quote for `targetJob` between an
 * incoming quote and an already-known quote, preventing a transient null or
 * PENDING/CALCULATING quote from regressing a settled quote for the same job/pro.
 */
export function pickMoreAuthoritativeCalloutQuote(
  incoming: CalloutQuote | null | undefined,
  existing: CalloutQuote | null | undefined,
  targetJob: JobRecord,
): CalloutQuote | null | undefined {
  const incValid = isQuoteCompatibleWithJob(incoming, targetJob);
  const exValid = isQuoteCompatibleWithJob(existing, targetJob);
  if (!incValid && !exValid) return incoming;
  if (incValid && !exValid) return incoming;
  if (!incValid && exValid) return existing;

  const incRank = CALLOUT_STATUS_RANK[incoming!.calloutStatus] ?? 0;
  const exRank = CALLOUT_STATUS_RANK[existing!.calloutStatus] ?? 0;
  if (incRank !== exRank) {
    return incRank > exRank ? incoming : existing;
  }
  const incTime = quoteTimestampMs(incoming!);
  const exTime = quoteTimestampMs(existing!);
  if (incTime !== exTime) {
    return incTime >= exTime ? incoming : existing;
  }
  return incoming;
}

function nonEmptyTrimmed(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

function pickPartyName(
  incoming: string | null | undefined,
  existing: string | null | undefined,
  placeholder: string,
): string {
  const inc = nonEmptyTrimmed(incoming);
  const ex = nonEmptyTrimmed(existing);
  const incReal = inc && inc !== placeholder ? inc : null;
  const exReal = ex && ex !== placeholder ? ex : null;
  return incReal || exReal || inc || ex || placeholder;
}

/**
 * Merges separately hydrated related-table fields (`profiles`, `motorist_profiles`,
 * and `job_callout_quotes`) onto `primary` from `secondary` when they belong to
 * the same job and party IDs.
 */
export function mergeJobRelatedFields(
  primary: JobRecord,
  secondary: JobRecord | null | undefined,
): JobRecord {
  if (!secondary || secondary.id !== primary.id) return primary;

  const sameMotorist =
    Boolean(primary.motoristId) && primary.motoristId === secondary.motoristId;
  const samePro =
    Boolean(primary.repairProId) && primary.repairProId === secondary.repairProId;

  const primaryQuote = primary.calloutQuote ?? primary.callout_quote;
  const secondaryQuote = secondary.calloutQuote ?? secondary.callout_quote;
  const bestQuote = pickMoreAuthoritativeCalloutQuote(
    primaryQuote,
    secondaryQuote,
    primary,
  );

  const motoristPhone = sameMotorist
    ? nonEmptyTrimmed(primary.motoristPhone) ??
      nonEmptyTrimmed(secondary.motoristPhone) ??
      primary.motoristPhone
    : primary.motoristPhone;
  const motoristPhoto = sameMotorist
    ? nonEmptyTrimmed(primary.motoristPhoto) ??
      nonEmptyTrimmed(secondary.motoristPhoto) ??
      primary.motoristPhoto
    : primary.motoristPhoto;
  const motoristVehicle = sameMotorist
    ? nonEmptyTrimmed(primary.motoristVehicle) ??
      nonEmptyTrimmed(secondary.motoristVehicle) ??
      primary.motoristVehicle
    : primary.motoristVehicle;
  const motoristName = sameMotorist
    ? pickPartyName(primary.motoristName, secondary.motoristName, "Customer")
    : primary.motoristName;

  const repairProPhone = samePro
    ? nonEmptyTrimmed(primary.repairProPhone) ??
      nonEmptyTrimmed(secondary.repairProPhone) ??
      primary.repairProPhone
    : primary.repairProPhone;
  const repairProPhoto = samePro
    ? nonEmptyTrimmed(primary.repairProPhoto) ??
      nonEmptyTrimmed(secondary.repairProPhoto) ??
      primary.repairProPhoto
    : primary.repairProPhoto;
  const repairProName = samePro
    ? pickPartyName(primary.repairProName, secondary.repairProName, "Repair Pro")
    : primary.repairProName;

  const unchanged =
    bestQuote === primary.calloutQuote &&
    motoristPhone === primary.motoristPhone &&
    motoristPhoto === primary.motoristPhoto &&
    motoristVehicle === primary.motoristVehicle &&
    motoristName === primary.motoristName &&
    repairProPhone === primary.repairProPhone &&
    repairProPhoto === primary.repairProPhoto &&
    repairProName === primary.repairProName;

  if (unchanged) return primary;

  const merged: JobRecord = {
    ...primary,
    motoristName,
    repairProName,
  };
  if (motoristPhone !== undefined) merged.motoristPhone = motoristPhone;
  if (motoristPhoto !== undefined) merged.motoristPhoto = motoristPhoto;
  if (motoristVehicle !== undefined) merged.motoristVehicle = motoristVehicle;
  if (repairProPhone !== undefined) merged.repairProPhone = repairProPhone;
  if (repairProPhoto !== undefined) merged.repairProPhoto = repairProPhoto;
  if (bestQuote !== undefined) {
    merged.calloutQuote = bestQuote;
    if ("callout_quote" in primary || "callout_quote" in secondary) {
      merged.callout_quote = bestQuote;
    }
  }
  return merged;
}

/**
 * Reconciles a background read snapshot (`incoming`) against `current` and
 * `started`:
 * - If `snapshotCanReplace(incoming, current, started)` is true, `incoming` is
 *   the primary core row and inherits any missing hydrated fields or more-final
 *   quote from `current`.
 * - If `current` had an intervening equal-version local commit (`current !== started`
 *   with `incoming.jobVersion === current.jobVersion`), `current` remains the
 *   primary core row while any newly hydrated contact/vehicle/quote fields on
 *   `incoming` enrich `current` without regressing its core state.
 * - If `incoming` has a strictly older/missing `jobVersion`, returns `null`.
 */
export function reconcileJobSnapshot(
  incoming: JobRecord,
  current: JobRecord | null,
  started: JobRecord | null,
): JobRecord | null {
  if (snapshotCanReplace(incoming, current, started)) {
    return mergeJobRelatedFields(incoming, current);
  }
  if (!current || current.id !== incoming.id) return null;
  const valid = (v: number | undefined): v is number =>
    typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
  if (valid(current.jobVersion)) {
    if (!valid(incoming.jobVersion) || incoming.jobVersion < current.jobVersion) {
      return null;
    }
    // Equal durable row version where an intervening commit or optimistic status
    // prevented full replacement: allow newly hydrated related fields to enrich current.
    const enriched = mergeJobRelatedFields(current, incoming);
    return enriched !== current ? enriched : null;
  }
  return null;
}
