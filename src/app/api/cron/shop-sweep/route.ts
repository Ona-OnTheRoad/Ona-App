import { apiFail, apiOk } from "@/lib/server/api-json";
import { hasSchedulerSecret } from "@/lib/server/jobs/deadlines/scheduler-auth";
import { runShopSweep } from "@/lib/server/shop/sweep";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Re-checks unconfirmed shop payments and cancels stale unpaid orders.
 * Scheduler secret only (fails closed when unset).
 */
export async function GET(req: Request) {
  if (!hasSchedulerSecret(req)) return apiFail("Unauthorized", 401, "unauthorized");
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Database not configured", 503, "no_db");
  }
  try {
    return apiOk(await runShopSweep());
  } catch (e) {
    console.error("[cron/shop-sweep] failed:", e);
    return apiFail("Shop sweep failed", 500, "sweep_failed");
  }
}

export async function POST(req: Request) {
  return GET(req);
}
