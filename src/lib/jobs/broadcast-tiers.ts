import { MAX_RADIUS_KM } from "@/lib/matching";

/**
 * Open-search broadcast: every eligible pro in range can see and claim a job,
 * but nearer pros see it first. Visibility widens with time since the broadcast
 * started, so a 2 km pro has a 10 s head start over a 5 km pro, and so on.
 * Pure and shared by the server read path and the client countdown.
 */
export type BroadcastTier = { afterMs: number; radiusKm: number };

export const BROADCAST_TIERS: readonly BroadcastTier[] = [
  { afterMs: 0, radiusKm: 2 },
  { afterMs: 10_000, radiusKm: 5 },
  { afterMs: 20_000, radiusKm: MAX_RADIUS_KM },
];

/** Negative/NaN count as "just started"; +Infinity means "every tier open". */
const safe = (ms: number) =>
  ms === Number.POSITIVE_INFINITY ? ms : Number.isFinite(ms) && ms > 0 ? ms : 0;

/** Radius (km) visible `elapsedMs` after the broadcast started. */
export function broadcastVisibleKm(elapsedMs: number): number {
  const e = safe(elapsedMs);
  let km = BROADCAST_TIERS[0].radiusKm;
  for (const t of BROADCAST_TIERS) if (e >= t.afterMs) km = t.radiusKm;
  return km;
}

/** Ms until the next tier opens, or null once the widest tier is open. */
export function nextTierDelayMs(elapsedMs: number): number | null {
  const e = safe(elapsedMs);
  const next = BROADCAST_TIERS.find((t) => t.afterMs > e);
  return next ? next.afterMs - e : null;
}

/** True when a pro at `distanceKm` may see (and claim) the job right now. */
export function proCanSeeBroadcast(input: {
  distanceKm: number;
  elapsedMs: number;
  customerRadiusKm: number;
  proRadiusKm: number;
}): boolean {
  const limit = Math.min(
    broadcastVisibleKm(input.elapsedMs),
    input.customerRadiusKm,
    input.proRadiusKm,
    MAX_RADIUS_KM,
  );
  return Number.isFinite(input.distanceKm) && input.distanceKm <= limit;
}

/** When the current broadcast began: the latest `sequential_pairing` history
 * entry (creation, reopen after a decline, or Retry), else job creation. */
export function broadcastStartedAtMs(
  history: unknown,
  createdAt: string | null | undefined,
): number | null {
  if (Array.isArray(history)) {
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i] as { status?: string; at?: string };
      if (h?.status === "sequential_pairing" && h.at) {
        const t = Date.parse(h.at);
        if (Number.isFinite(t)) return t;
      }
    }
  }
  const c = createdAt ? Date.parse(createdAt) : Number.NaN;
  return Number.isFinite(c) ? c : null;
}

/** How long an open broadcast stays claimable before it expires unclaimed.
 * Matches the per-pro review window (PAIRING_WINDOW_MS) so the customer's
 * existing 144 s countdown and Retry flow are unchanged. */
export const BROADCAST_WINDOW_MS = 144_000;
