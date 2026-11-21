/**
 * Automated payout retry (Vercel Cron + admin).
 * Processes pending_settlement escrows when Flutterwave Available is ready.
 * Auth: scheduler secret in a header (hasSchedulerSecret, fails closed), or an
 * admin session with escrow_release. The pg_cron job (migration 067) sends
 * Authorization: Bearer <payout_retry_secret>, which must equal a host cron secret.
 */

import { apiFail, apiOk } from "@/lib/server/api-json";
import { processDuePayoutRetries } from "@/lib/server/payments/payout-settlement";
import { requirePermission, AdminAuthError } from "@/lib/server/admin-auth";
import { hasSchedulerSecret } from "@/lib/server/jobs/deadlines/scheduler-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function run(req: Request) {
  if (hasSchedulerSecret(req)) {
    const result = await processDuePayoutRetries(30);
    return apiOk({ ...result, source: "cron" });
  }
  try {
    await requirePermission("escrow_release");
    const result = await processDuePayoutRetries(30);
    return apiOk({ ...result, source: "admin" });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return apiFail(e.message, e.status, e.code || "auth");
    }
    return apiFail("Unauthorized", 401);
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
