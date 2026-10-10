import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { loadIdentityRoleFlags } from "@/lib/server/identity/role-flags";

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
    return apiOk(await loadIdentityRoleFlags(auth.userId));
  } catch (e) {
    return apiFail(
      e instanceof Error ? e.message : "Could not load role flags",
      500,
    );
  }
}
