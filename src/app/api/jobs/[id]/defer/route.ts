import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { deferJob, getJob } from "@/lib/server/jobs/job-store";
import { serverLogger } from "@/lib/server/structured-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const proId: string | undefined = body.proId;
    if (!proId) return apiFail("Missing proId", 400);
    if (proId !== auth.userId) {
      return apiFail("Only the assigned Repair Pro can defer", 403);
    }

    const existing = await getJob(id);
    if (!existing) return apiFail("Job not found", 404);
    if (existing.repairProId !== auth.userId) {
      return apiFail("Not your job", 403);
    }

    await deferJob(id, proId);
    const job = await getJob(id);
    if (!job) return apiFail("Job not found", 404);
    return apiOk({ job });
  } catch (e) {
    serverLogger.error("job.defer.failed", { operation: "defer", jobId: id }, req, e);
    return apiFail("The job could not be deferred; try again shortly", 500, "job_defer_failed");
  }
}
