import "server-only";
import type { createServiceSupabase } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceSupabase>;

/**
 * Stamp a user's phone as verified on the profile and on whichever role tables
 * exist for them (Care and the Tier 1 UI read these). Best-effort: a missing
 * optional column must never fail the caller.
 */
export async function markUserPhoneVerified(sb: Db, userId: string): Promise<void> {
  const ts = new Date().toISOString();
  await sb
    .from("profiles")
    .update({ phone_verified: true, phone_verified_at: ts, updated_at: ts })
    .eq("id", userId);
  for (const table of ["motorist_profiles", "repair_pro_profiles"] as const) {
    try {
      await sb
        .from(table)
        .update({ phone_verified: true, phone_verified_at: ts })
        .eq("user_id", userId);
    } catch {
      /* optional columns */
    }
  }
}
