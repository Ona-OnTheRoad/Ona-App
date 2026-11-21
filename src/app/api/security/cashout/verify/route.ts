import { apiFail, apiOk } from "@/lib/server/api-json";
import {
  processDueCashoutRetries,
  verifyPendingCashouts,
} from "@/lib/server/security/cashout-engine";
import { hasSchedulerSecret } from "@/lib/server/jobs/deadlines/scheduler-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cashout settlement cron: retries due transfers + verifies stuck ones.
 * Scheduler secret only (hasSchedulerSecret: header, fails closed).
 * Wire in Supabase pg_cron or Vercel Cron every 10 minutes.
 */
export async function GET(req: Request) {
  if (!hasSchedulerSecret(req)) return apiFail("Unauthorized", 401, "unauthorized");
  const retries = await processDueCashoutRetries();
  const verified = await verifyPendingCashouts();
  return apiOk({ retries, verified });
}

export async function POST(req: Request) {
  return GET(req);
}
