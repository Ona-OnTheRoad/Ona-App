import { apiFail, apiOk } from "@/lib/server/api-json";
import { sweepPairing } from "@/lib/server/pairing/pairing-engine";
import { canRunMaintenance } from "@/lib/server/jobs/deadlines/scheduler-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Authenticated browser recovery remains available; the minute scheduler uses deadline-sweep. */
async function run(req: Request) {
  if (!(await canRunMaintenance(req))) return apiFail("Unauthorized", 401, "unauthorized");
  try {
    return apiOk({ ...await sweepPairing(25),
      rule: "Expired stored pairing deadlines advance to the next merit-ranked pro; the shared dispatch window is 144 seconds." });
  } catch {
    return apiFail("Pairing sweep unavailable; retry", 503, "sweep_incomplete");
  }
}
export const GET = run;
export const POST = run;
