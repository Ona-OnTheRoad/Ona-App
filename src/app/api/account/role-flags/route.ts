import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { resolvePrimaryAccountType } from "@/lib/supabase/mappers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Caller's own dual-role flags (motorist + repair pro side tables). */
export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server not configured", 503);
  }
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const sb = createServiceSupabase();
    const [mot, pro] = await Promise.all([
      sb
        .from("motorist_profiles")
        .select("user_id, created_at")
        .eq("user_id", auth.userId)
        .maybeSingle(),
      sb
        .from("repair_pro_profiles")
        .select("user_id, created_at")
        .eq("user_id", auth.userId)
        .maybeSingle(),
    ]);
    const hasMotorist = Boolean(mot.data);
    const hasPro = Boolean(pro.data);
    return apiOk({
      hasMotorist,
      hasPro,
      primaryAccountType: resolvePrimaryAccountType({
        hasMotorist,
        hasPro,
        motoristCreatedAt: (mot.data as { created_at?: string } | null)
          ?.created_at,
        proCreatedAt: (pro.data as { created_at?: string } | null)
          ?.created_at,
      }),
    });
  } catch (e) {
    return apiFail(
      e instanceof Error ? e.message : "Could not load role flags",
      500,
    );
  }
}
