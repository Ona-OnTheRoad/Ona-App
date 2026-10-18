import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import { resolvePrimaryAccountType } from "@/lib/supabase/mappers";
import type { AccountType } from "@/lib/types";

export type IdentityRoleFlags = {
  hasMotorist: boolean;
  hasPro: boolean;
  primaryAccountType: AccountType;
};

/** Read existing side-profile flags and infer the original role from creation dates. */
export async function loadIdentityRoleFlags(userId: string): Promise<IdentityRoleFlags> {
  const sb = createServiceSupabase();
  const [mot, pro] = await Promise.all([
    sb
      .from("motorist_profiles")
      .select("user_id, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    sb
      .from("repair_pro_profiles")
      .select("user_id, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  const hasMotorist = Boolean(mot.data);
  const hasPro = Boolean(pro.data);
  return {
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
  };
}
