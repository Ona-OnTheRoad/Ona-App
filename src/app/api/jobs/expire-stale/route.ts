import { canRunMaintenance } from "@/lib/server/jobs/deadlines/scheduler-auth";
import { apiFail, apiOk } from "@/lib/server/api-json";
import {
  expireOverdueBookedJobs,
  expireUnacceptedJobs,
} from "@/lib/server/jobs/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Zombie guard: jobs that reached a terminal status but whose flow_status
 * is still a live pairing value would linger on the Dispatch board forever.
 * Reset them each sweep (additive hygiene, touches only stale rows).
 */
async function resetZombieFlowStatuses(): Promise<number> {
  try {
    const { createServiceSupabase } = await import(
      "@/lib/supabase/server"
    );
    const { isSupabaseAdminConfigured: configured } = await import(
      "@/lib/supabase/env"
    );
    if (!configured()) return 0;
    const sb = createServiceSupabase();
    const { data, error } = await sb
      .from("service_requests")
      .update({ flow_status: "cancelled" })
      .in("flow_status", [
        "waiting_for_selected",
        "selected_review",
        "sequential_pairing",
        "waiting_for_pro",
        "reserved",
        "searching",
      ])
      .in("status", [
        "cancelled",
        "expired",
        "completed",
        "satisfied",
        "released",
        "refunded",
      ])
      .select("id");
    if (error) return 0;
    return data?.length ?? 0;
  } catch {
    return 0;
  }
}

// The pairing sweep has its own dedicated every-minute route; expire-stale
// only runs it as a backup, throttled to ≤1x/30s per instance so the ~8s
// external hits don't re-run the same indexed sweep 7× a minute.
const PAIRING_SWEEP_INTERVAL_MS = 30_000;
let lastPairingSweepAt = 0;

async function run(req: Request) {
  try {
    if (!(await canRunMaintenance(req))) return apiFail("Unauthorized", 401, "unauthorized");
    // Authenticated recovery runs the existing broad maintenance operations.
    // Browser sessions retain recovery access without receiving the cron secret.
    let result: { checked: number; cancelled: number; ids: string[] } = {
      checked: 0,
      cancelled: 0,
      ids: [],
    };
    let zombies = 0;
    result = await expireOverdueBookedJobs(50);

    // Sweep unaccepted jobs reroute to next pro after 1 min, expire after 15 min
    let unacceptedResult: {
      checked: number;
      rerouted: number;
      expired: number;
    } | null = null;
    try {
      unacceptedResult = await expireUnacceptedJobs(40);
    } catch (e) {
      console.error("expireUnacceptedJobs in expire-stale", e);
    }

    // Zombie guard: clear stale live flow_status on terminal jobs
    try {
      zombies = await resetZombieFlowStatuses();
    } catch (e) {
      console.error("resetZombieFlowStatuses in expire-stale", e);
    }

    // SSPE sweep enforce 144s pairing deadlines and advance to next pro.
    // Backed by the dedicated pairing-sweep route (every minute); throttled
    // here so the frequent expire-stale hits don't duplicate it every 8s.
    let pairingResult: {
      checked: number;
      timedOut: number;
      expired: number;
    } | null = null;
    const now = Date.now();
    if (now - lastPairingSweepAt >= PAIRING_SWEEP_INTERVAL_MS) {
      lastPairingSweepAt = now;
      try {
        const { sweepPairing } =
          await import("@/lib/server/pairing/pairing-engine");
        pairingResult = await sweepPairing(50);
      } catch (e) {
        console.error("sweepPairing in expire-stale", e);
      }
    }

    // "Add another repair pro": notify the motorist when a linked scheduled
    // request's 60-min dispatch mark is reached; silently cancel it if the
    // primary tow request was cancelled/expired first. Runs on the same
    // ~1/min cadence as the pairing sweep above.
    let scheduledDispatchResult: {
      checked: number;
      cancelled: number;
      notified: number;
    } | null = null;
    try {
      const { sweepScheduledDispatches } =
        await import("@/lib/server/pairing/pairing-engine");
      scheduledDispatchResult = await sweepScheduledDispatches(50);
    } catch (e) {
      console.error("sweepScheduledDispatches in expire-stale", e);
    }

    let payoutRetry: {
      checked: number;
      succeeded: number;
      stillPending: number;
      failed: number;
      ids: string[];
    } | null = null;
    try {
      const { processDuePayoutRetries } =
        await import("@/lib/server/payments/payout-settlement");
      payoutRetry = await processDuePayoutRetries(30);
    } catch (e) {
      console.error("payout retry in expire-stale", e);
    }
    return apiOk({
      ...result,
      unaccepted: unacceptedResult,
      pairing: pairingResult,
      scheduledDispatch: scheduledDispatchResult,
      payoutRetry,
      rule: "Agreed unpaid: payment details expire after 11 min; Booked not completed within 6h: cancel + refund; Completed 6h: auto-release pro 87.5%; PENDING_SETTLEMENT: auto-retry when FLW Available is enough",
    });
  } catch (e) {
    return apiFail(e instanceof Error ? e.message : "Expire sweep failed", 500);
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
