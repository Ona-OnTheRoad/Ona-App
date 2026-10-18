import { apiFail, apiOk } from "@/lib/server/api-json";
import { serverLogger } from "@/lib/server/structured-logger";
import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  armSurfacePairingDeadline,
  getJob,
} from "@/lib/server/jobs/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "The request just appeared on this pro's screen." Server-owned arming:
 * stamps `pairing_deadline = now + 66s` EXACTLY ONCE per offer only when a
 * deadline isn't armed yet (dispatch/create leave it NULL by design). Because
 * neither dispatch nor the surface call ever re-arms an already-set deadline,
 * the 66s timer starts at 66 on the pro's card AND the customer's ring at the
 * same instant and never rolls back to a higher number.
 *
 * Safety: the pairing sweep arms the deadline itself after
 * `SURFACE_FALLBACK_GRACE_MS` if the pro's device never surfaces (app closed),
 * so timeouts/advance keep working exactly as before.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    if (!id || !isSupabaseAdminConfigured()) {
      return apiFail("Surface check unavailable", 503);
    }

    const job = await getJob(id);
    if (!job) return apiFail("Request not found", 404);

    if (job.repairProId !== auth.userId) {
      return apiFail("Not assigned to this request", 403);
    }

    const stage = job.pairingStage ?? "";
    const result = await armSurfacePairingDeadline(job);
    if (!result.ok) {
      if (result.conflict) {
        return apiFail("Request changed; reload and retry", 409);
      }
      serverLogger.error("job.surface.update_failed", { operation: "surface", jobId: id }, req, result.message);
      return apiFail("Unable to update this request right now", 500, "job_surface_failed");
    }

    return apiOk({
      id: job.id,
      pairingStage: stage,
      pairingDeadline: result.pairingDeadline,
      armed: result.armed,
      serverNow: new Date().toISOString(),
    });
  } catch (e) {
    serverLogger.error("job.surface.failed", { operation: "surface", jobId: id }, req, e);
    return apiFail("Unable to load this request right now", 500, "job_surface_failed");
  }
}
