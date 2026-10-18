import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import { identityStatus } from "./identity-sync";

export type AdminSharedProfileResult =
  | { ok: true; profile: Record<string, unknown> | null }
  | { ok: false; message: string };

export type AdminIdentityReader = {
  loadSharedProfile(): Promise<AdminSharedProfileResult>;
  loadMotoristProfile(): Promise<Record<string, unknown> | null>;
  loadRepairProProfile(): Promise<Record<string, unknown> | null>;
  loadStatus(): ReturnType<typeof identityStatus>;
};

/** Read-only identity view for one admin-selected user, with an internally owned client. */
export function createAdminIdentityReader(userId: string): AdminIdentityReader {
  const supabase = createServiceSupabase();
  return {
    async loadSharedProfile() {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "id, role, full_name, phone, email, city, area, is_active, avatar_url, created_at, updated_at",
        )
        .eq("id", userId)
        .maybeSingle();
      if (error) return { ok: false, message: error.message };
      return { ok: true, profile: profile as Record<string, unknown> | null };
    },
    async loadMotoristProfile() {
      const { data } = await supabase
        .from("motorist_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return (data ?? null) as Record<string, unknown> | null;
    },
    async loadRepairProProfile() {
      const { data } = await supabase
        .from("repair_pro_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return (data ?? null) as Record<string, unknown> | null;
    },
    loadStatus() {
      return identityStatus(supabase, userId);
    },
  };
}
