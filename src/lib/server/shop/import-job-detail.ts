import "server-only";
import type { NextRequest } from "next/server";
import { AdminAuthError, requirePermission } from "@/lib/server/admin-auth";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { listStagingSummary } from "@/lib/server/shop/data-sources";

/** GET /api/admin/shop/data-sources/[id]/jobs/[jobId] job + staging summary. */
export async function jobDetail(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail(
      "Supabase is not configured",
      503,
      "supabase_not_configured",
    );
  }
  try {
    await requirePermission("shop_catalog");
    const { jobId } = await params;
    const sb = createServiceSupabase();
    const { data: job, error } = await sb
      .from("shop_import_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!job) return apiFail("Job not found", 404, "NOT_FOUND");

    const { data: batches } = await sb
      .from("shop_import_batches")
      .select("*")
      .eq("job_id", jobId)
      .order("batch_no", { ascending: true });
    const staging = await listStagingSummary(sb, jobId);

    return apiOk({ job, batches: batches ?? [], staging });
  } catch (e) {
    if (e instanceof AdminAuthError)
      return apiFail(e.message, e.status, "admin_auth");
    const msg = e instanceof Error ? e.message : "Failed";
    return apiFail(msg, 500);
  }
}
