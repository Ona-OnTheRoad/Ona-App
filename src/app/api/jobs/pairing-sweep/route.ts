import { apiFail, apiOk } from "@/lib/server/api-json";
import { serverLogger } from "@/lib/server/structured-logger";
import { sweepPairing } from "@/lib/server/pairing/pairing-engine";
import { canRunMaintenance } from "@/lib/server/jobs/deadlines/scheduler-auth";
import { runCoalescedPairingRecovery } from "@/lib/server/jobs/deadlines/maintenance-runner";
import { SweepBusyError } from "@/lib/server/jobs/deadlines/sweep-lease";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAIRING_RULE =
  "Expired stored pairing deadlines advance to the next merit-ranked pro; the shared dispatch window is 144 seconds.";

/** Authenticated browser recovery remains available; the minute scheduler uses deadline-sweep. */
async function run(req: Request) {
  if (!(await canRunMaintenance(req))) {
    return apiFail("Unauthorized", 401, "unauthorized");
  }
  try {
    const result = await runCoalescedPairingRecovery(() => sweepPairing(25));
    return apiOk({ ...result, rule: PAIRING_RULE });
  } catch (error) {
    if (error instanceof SweepBusyError) {
      return apiOk({
        checked: 0,
        timedOut: 0,
        expired: 0,
        busy: true,
        rule: PAIRING_RULE,
      });
    }
    serverLogger.error(
      "jobs.pairing_sweep.failed",
      { operation: "pairing_sweep" },
      req,
      error,
    );
    return apiFail("Pairing sweep unavailable; retry", 503, "sweep_incomplete");
  }
}
export const GET = run;
export const POST = run;
