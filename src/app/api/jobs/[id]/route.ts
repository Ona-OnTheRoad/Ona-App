import { apiFail, apiFailFromError, apiOk } from "@/lib/server/api-json";
import { serverLogger } from "@/lib/server/structured-logger";
import { isJobParty, requireUser } from "@/lib/server/auth-utils";
import { resolveJobCalloutQuote } from "@/lib/server/callout/resolve";
import { getJob } from "@/lib/server/jobs/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadJobForUser(
  req: Request,
  id: string,
  bodyToken?: string | null,
) {
  const auth = await requireUser(req, { bodyToken: bodyToken || null });
  if (!auth.ok) return auth.response;

  const job = await getJob(id);
  if (!job) return apiFail("Job not found", 404);
  if (!isJobParty(auth.userId, job)) {
    return apiFail("Forbidden", 403, "forbidden");
  }
  let calloutQuote = job.calloutQuote ?? null;
  try {
    calloutQuote = (await resolveJobCalloutQuote(job)) ?? calloutQuote;
  } catch (error) {
    serverLogger.warn("job.callout_quote.unavailable", {
      operation: "resolve_callout_quote",
      jobId: id,
    }, req, error);
  }
  return apiOk({
    job: { ...job, calloutQuote },
    serverNow: new Date().toISOString(),
  });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    // Query token fallback if a proxy strips Authorization on GET
    const q = new URL(req.url).searchParams.get("access_token");
    return await loadJobForUser(req, id, q);
  } catch (e) {
    serverLogger.error("job.read.failed", { operation: "get_job" }, req, e);
    return apiFailFromError(e, "Could not load job");
  }
}

/**
 * Preferred load path same auth surface as POST /api/jobs (create).
 * Some production proxies drop Bearer on GET /api/jobs/[id] only.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    let bodyToken: string | null = null;
    try {
      const body = (await req.json().catch(() => null)) as {
        access_token?: string;
        action?: string;
      } | null;
      if (typeof body?.access_token === "string") {
        bodyToken = body.access_token;
      }
    } catch {
      /* empty body ok */
    }
    return await loadJobForUser(req, id, bodyToken);
  } catch (e) {
    serverLogger.error("job.read.failed", { operation: "get_job" }, req, e);
    return apiFailFromError(e, "Could not load job");
  }
}
