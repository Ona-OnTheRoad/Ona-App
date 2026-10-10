import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { listAdminIdentityUsers } from "@/lib/server/identity/admin-users";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * List users with side profiles.
 * Does NOT use nested embeds multiple FKs between profiles and motorist_profiles
 * (user_id + identity_reviewed_by) break PostgREST auto-embed.
 */
export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail(
      "Supabase is not configured",
      503,
      "supabase_not_configured",
    );
  }
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const role = searchParams.get("role");
    const result = await listAdminIdentityUsers(q, role);
    if (!result.ok) return apiFail(result.message, 500);
    return apiOk({ users: result.users });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return apiFail(e.message, e.status, "auth");
    }
    return apiFail("Failed to list users", 500);
  }
}
