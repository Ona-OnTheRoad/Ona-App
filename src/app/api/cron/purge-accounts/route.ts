import { apiFail, apiOk } from "@/lib/server/api-json";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { hasSchedulerSecret } from "@/lib/server/jobs/deadlines/scheduler-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Database not configured", 503, "no_db");
  }
  if (!hasSchedulerSecret(req)) {
    return apiFail("Unauthorized", 401, "auth");
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase.rpc("purge_expired_deletions");

  if (error) return apiFail(error.message, 500);

  return apiOk({ purgedCount: data ?? 0 });
}
