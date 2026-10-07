import { NextRequest } from "next/server";
import { AdminAuthError, requirePermission } from "@/lib/server/admin-auth";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { listImportJobs } from "@/lib/server/shop/data-sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/shop/data-sources/[id] source detail + recent jobs. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    const { id } = await params;
    const sb = createServiceSupabase();
    const { data: source, error } = await sb
      .from("shop_data_sources")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!source) return apiFail("Source not found", 404, "NOT_FOUND");

    const { data: connectors } = await sb
      .from("shop_source_connectors")
      .select("*")
      .eq("data_source_id", id);
    const jobs = await listImportJobs(sb, { limit: 20 });

    return apiOk({
      source,
      connectors: connectors ?? [],
      jobs: jobs.filter((j) => j.data_sources?.[0]?.id === id),
    });
  } catch (e) {
    if (e instanceof AdminAuthError)
      return apiFail(e.message, e.status, "admin_auth");
    const msg = e instanceof Error ? e.message : "Failed";
    return apiFail(msg, 500);
  }
}
