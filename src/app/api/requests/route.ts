import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { mapRequestRow } from "@/lib/supabase/mappers";
import type { ServiceRequestRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Legacy `service_requests` list for a user (motorist or repair pro side).
 * Mirrors what the browser used to query directly, just with an explicit
 * ownership check instead of relying on RLS.
 */
export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server not configured", 503);
  }
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const role = searchParams.get("role");
  if (!userId || (role !== "motorist" && role !== "professional")) {
    return apiFail("userId and role required", 400);
  }
  if (userId !== auth.userId) {
    return apiFail("Forbidden", 403, "forbidden");
  }

  try {
    const sb = createServiceSupabase();
    let q = sb
      .from("service_requests")
      .select(
        "id, motorist_id, repair_pro_id, service_type, status, description, pickup_lat, pickup_lng, pickup_address, radius_km, created_at, updated_at",
      )
      .order("created_at", { ascending: false });
    // Pros only ever see jobs assigned to them. A broad "any open job"
    // clause would leak another pro's accepted jobs into this list.
    q = role === "motorist" ? q.eq("motorist_id", userId) : q.eq("repair_pro_id", userId);

    const { data, error } = await q.limit(30);
    if (error) return apiFail(error.message, 500);
    if (!data?.length) return apiOk({ requests: [] });

    const proIds = [
      ...new Set(
        (data as ServiceRequestRow[])
          .map((r) => r.repair_pro_id)
          .filter(Boolean) as string[],
      ),
    ];
    const names = new Map<string, string>();
    if (proIds.length) {
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, full_name")
        .in("id", proIds);
      for (const p of profiles || []) {
        names.set(
          (p as { id: string; full_name: string }).id,
          (p as { id: string; full_name: string }).full_name,
        );
      }
    }

    const requests = (data as ServiceRequestRow[]).map((r) =>
      mapRequestRow(
        r,
        r.repair_pro_id ? names.get(r.repair_pro_id) : undefined,
      ),
    );
    return apiOk({ requests });
  } catch (e) {
    return apiFail(
      e instanceof Error ? e.message : "Could not load requests",
      500,
    );
  }
}
