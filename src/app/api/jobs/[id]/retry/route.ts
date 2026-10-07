import { apiFail, apiOk } from "@/lib/server/api-json";
import { isJobParty, requireUser } from "@/lib/server/auth-utils";
import { retrySearch } from "@/lib/server/pairing/pairing-engine";
import { getJob } from "@/lib/server/jobs/job-store";
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

    const job = await getJob(id);
    if (!job) return apiFail("Job not found", 404);
    if (!isJobParty(auth.userId, job)) {
      return apiFail("Forbidden", 403, "forbidden");
    }
    // Only the motorist can re-run their own search.
    if (job.motoristId !== auth.userId) {
      return apiFail("Only the customer can retry this search", 403);
    }

    const result = await retrySearch(id);
    if (!result.ok) {
      return apiFail(
        result.error || "Could not retry search",
        result.status || 500,
      );
    }

    const fresh = await getJob(id);
    return apiOk({ job: fresh ?? job, serverNow: new Date().toISOString() });
  } catch (e) {
    serverLogger.error("job.retry.failed", { operation: "retry", jobId: id }, req, e);
    return apiFail("Retry could not be completed; try again shortly", 500, "job_retry_failed");
  }
}
