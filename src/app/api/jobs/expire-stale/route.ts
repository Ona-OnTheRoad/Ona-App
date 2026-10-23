import {
  canRunMaintenance,
  hasSchedulerSecret,
} from "@/lib/server/jobs/deadlines/scheduler-auth";
import { runMaintenanceFamily } from "@/lib/server/jobs/deadlines/maintenance-runner";
import { SweepBusyError } from "@/lib/server/jobs/deadlines/sweep-lease";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { serverLogger } from "@/lib/server/structured-logger";
import {
  expireOverdueBookedJobs,
  expireUnacceptedJobs,
  resetZombieFlowStatuses,
} from "@/lib/server/jobs/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function run(req: Request) {
  try {
    if (!(await canRunMaintenance(req))) {
      return apiFail("Unauthorized", 401, "unauthorized");
    }
    const bypassThrottle = hasSchedulerSecret(req);

    // Authenticated recovery runs the existing broad maintenance operations,
    // coalescing in-flight work and throttling repeated browser-triggered scans.
    const { value: result } = await runMaintenanceFamily(
      "jobDeadlines",
      () => expireOverdueBookedJobs(50),
      {
        bypassThrottle,
        throttledValue: { checked: 0, cancelled: 0, released: 0, ids: [] },
      },
    );

    // Sweep unaccepted jobs reroute to next pro after 1 min, expire after 15 min
    let unacceptedResult: {
      checked: number;
      rerouted: number;
      expired: number;
    } | null = null;
    try {
      const unaccepted = await runMaintenanceFamily(
        "unaccepted",
        () => expireUnacceptedJobs(40),
        { bypassThrottle, throttledValue: null },
      );
      unacceptedResult = unaccepted.value;
    } catch (e) {
      serverLogger.error(
        "jobs.expire_stale.unaccepted_failed",
        { operation: "expire_unaccepted" },
        req,
        e,
      );
    }

    // Zombie guard: clear stale live flow_status on terminal jobs
    try {
      await runMaintenanceFamily(
        "zombies",
        () => resetZombieFlowStatuses(),
        { bypassThrottle, throttledValue: 0 },
      );
    } catch (e) {
      serverLogger.error(
        "jobs.expire_stale.zombie_reset_failed",
        { operation: "reset_zombie_flow" },
        req,
        e,
      );
    }

    // SSPE sweep enforce 144s pairing deadlines and advance to next pro.
    // Backed by the dedicated pairing-sweep route (every minute); throttled
    // here so frequent expire-stale hits don't duplicate it.
    let pairingResult: {
      checked: number;
      timedOut: number;
      expired: number;
    } | null = null;
    try {
      const pairing = await runMaintenanceFamily(
        "pairing",
        async () => {
          const { sweepPairing } = await import(
            "@/lib/server/pairing/pairing-engine"
          );
          return sweepPairing(50);
        },
        { bypassThrottle, throttledValue: null },
      );
      pairingResult = pairing.value;
    } catch (e) {
      if (!(e instanceof SweepBusyError)) {
        serverLogger.error(
          "jobs.expire_stale.pairing_failed",
          { operation: "sweep_pairing" },
          req,
          e,
        );
      }
    }

    // "Add another repair pro": notify the motorist when a linked scheduled
    // request's 60-min dispatch mark is reached; silently cancel it if the
    // primary tow request was cancelled/expired first.
    let scheduledDispatchResult: {
      checked: number;
      cancelled: number;
      notified: number;
    } | null = null;
    try {
      const scheduled = await runMaintenanceFamily(
        "scheduledDispatch",
        async () => {
          const { sweepScheduledDispatches } = await import(
            "@/lib/server/pairing/pairing-engine"
          );
          return sweepScheduledDispatches(50);
        },
        { bypassThrottle, throttledValue: null },
      );
      scheduledDispatchResult = scheduled.value;
    } catch (e) {
      serverLogger.error(
        "jobs.expire_stale.scheduled_dispatch_failed",
        { operation: "sweep_scheduled_dispatch" },
        req,
        e,
      );
    }

    let payoutRetry: {
      checked: number;
      succeeded: number;
      stillPending: number;
      failed: number;
      ids: string[];
    } | null = null;
    try {
      const payout = await runMaintenanceFamily(
        "payoutRetry",
        async () => {
          const { processDuePayoutRetries } = await import(
            "@/lib/server/payments/payout-settlement"
          );
          return processDuePayoutRetries(30);
        },
        { bypassThrottle, throttledValue: null },
      );
      payoutRetry = payout.value;
    } catch (e) {
      serverLogger.error(
        "jobs.expire_stale.payout_retry_failed",
        { operation: "payout_retry" },
        req,
        e,
      );
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
    serverLogger.error(
      "jobs.expire_stale.failed",
      { operation: "expire_stale" },
      req,
      e,
    );
    return apiFail(
      "Maintenance sweep failed; retry shortly",
      500,
      "maintenance_failed",
    );
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
