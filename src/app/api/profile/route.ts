import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { loadOwnIdentityProfile } from "@/lib/server/identity/own-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Caller's own full profile (bank details, NIN/BVN, gov-ID, guarantor).
 * No client-supplied userId is accepted at all -- not even as a
 * cross-check -- because of how sensitive this payload is.
 */
export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server not configured", 503);
  }
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  try {
    return apiOk(await loadOwnIdentityProfile(userId));
  } catch (e) {
    return apiFail(
      e instanceof Error ? e.message : "Could not load profile",
      500,
    );
  }
}
