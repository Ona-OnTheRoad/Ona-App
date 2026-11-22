import { apiFail, apiOk } from "@/lib/server/api-json";
import { pruneIdempotentOps } from "@/lib/server/idempotency-prune";
import { hasSchedulerSecret } from "@/lib/server/jobs/deadlines/scheduler-auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily cron: delete idempotent_ops rows past their retention so the ledger
 * does not grow forever. Scheduler secret only (header, fails closed when
 * unset); never a user token or a query parameter.
 */
export async function GET(req: Request) {
  if (!hasSchedulerSecret(req)) return apiFail("Unauthorized", 401, "unauthorized");
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Database not configured", 503, "no_db");
  }

  const result = await pruneIdempotentOps();
  if (!result.ok) {
    console.error(`[cron/prune-idempotent-ops] delete failed: ${result.error}`);
    return apiFail("Could not prune the ledger", 500, "prune_failed");
  }
  console.info(
    `[cron/prune-idempotent-ops] deleted ${result.deleted} rows created before ${result.cutoff}`,
  );
  return apiOk({ deleted: result.deleted, cutoff: result.cutoff });
}

export async function POST(req: Request) {
  return GET(req);
}
