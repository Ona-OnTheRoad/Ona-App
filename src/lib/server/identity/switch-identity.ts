import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/types";
import { ensureUserRole, syncPayoutAcrossRoles, type RoleType } from "./identity-sync";
import { loadSwitchedIdentityProfile } from "./switch-profile";

export type SwitchIdentityResult =
  | { ok: true; identity: Awaited<ReturnType<typeof loadSwitchedIdentityProfile>> }
  | { ok: false; reason: "not_found" | "inactive" | "needs_signup" }
  | { ok: false; reason: "update_failed"; message: string };

/** Switch between completed side-profiles; never create/delete a role profile. */
export async function switchIdentityRole(userId: string, role: RoleType): Promise<SwitchIdentityResult> {
  const admin = createServiceSupabase();

  // Load current profile
  const { data: existing, error: findErr } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (findErr || !existing) {
    return { ok: false, reason: "not_found" };
  }

  // Admin freeze / deactivation is hard never auto-revive on role switch
  if (!existing.is_active) {
    return { ok: false, reason: "inactive" };
  }

  // Require a real side-profile (completed signup). Do not invent empty rows.
  if (role === "motorist") {
    const { data: motRow } = await admin
      .from("motorist_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!motRow) {
      return { ok: false, reason: "needs_signup" };
    }
  } else {
    const { data: proRow } = await admin
      .from("repair_pro_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!proRow) {
      return { ok: false, reason: "needs_signup" };
    }
  }

  // Track switch for Care admin + dual-role analytics (DB-synced)
  const prevRole = existing.role as string;
  const isActualSwitch = prevRole !== role;
  const existingPrimary =
    (existing as { primary_role?: string | null }).primary_role || null;
  const prevCount = Number(
    (existing as { role_switch_count?: number | null }).role_switch_count || 0,
  );
  const profilePatch: Record<string, unknown> = { role };
  if (!existingPrimary) {
    // First time we see a switch/patch: lock original as previous (or current if same)
    profilePatch.primary_role = prevRole === "admin" ? role : prevRole;
  }
  if (isActualSwitch) {
    profilePatch.last_role_switch_at = new Date().toISOString();
    profilePatch.role_switch_count = prevCount + 1;
  }

  let profileAfter: ProfileRow | null = null;
  {
    const { data: updated, error: updErr } = await admin
      .from("profiles")
      .update(profilePatch)
      .eq("id", userId)
      .select("*")
      .single();
    if (!updErr && updated) {
      profileAfter = updated as ProfileRow;
    } else {
      // Columns may be missing before migration fall back to role-only
      const { data: fallback, error: fbErr } = await admin
        .from("profiles")
        .update({ role })
        .eq("id", userId)
        .select("*")
        .single();
      if (fbErr || !fallback) {
        return {
          ok: false,
          reason: "update_failed",
          message: updErr?.message || fbErr?.message || "Could not switch role",
        };
      }
      profileAfter = fallback as ProfileRow;
    }
  }

  // Switching away from Repair Pro → go Away so motorists cannot find them.
  // Switching into Repair Pro → stay Away until they tap Live on the dashboard.
  if (role === "motorist") {
    await admin
      .from("repair_pro_profiles")
      .update({ is_online: false })
      .eq("user_id", userId);
  } else {
    await admin
      .from("repair_pro_profiles")
      .update({ is_online: false })
      .eq("user_id", userId);
  }

  // Unified identity: keep the role registry + canonical bank in sync so a
  // bank entered on one role is reused by the other without re-entry.
  await ensureUserRole(admin, userId, role, {
    userId,
    source: "switch_role",
  });
  await syncPayoutAcrossRoles(admin, userId, { userId, source: "switch_role" });

  const identity = await loadSwitchedIdentityProfile(admin, userId, role, profileAfter);
  return { ok: true, identity };
}
