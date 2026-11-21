import { apiFail, apiOk } from "@/lib/server/api-json";
import { processDueNotificationRetries } from "@/lib/server/notifications-retry";
import { hasSchedulerSecret } from "@/lib/server/jobs/deadlines/scheduler-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Notification delivery retry cron, processes the durable queue so a failed
 * push/SMS/email is retried with backoff instead of being lost forever.
 * Scheduler secret only (hasSchedulerSecret: header, fails closed).
 */
export async function GET(req: Request) {
  if (!hasSchedulerSecret(req)) return apiFail("Unauthorized", 401, "unauthorized");
  const result = await processDueNotificationRetries();
  return apiOk(result);
}

export async function POST(req: Request) {
  return GET(req);
}
