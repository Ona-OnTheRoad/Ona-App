import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { profileToUserProfile, resolvePrimaryAccountType } from "@/lib/supabase/mappers";
import { dbRoleToAccountType } from "@/lib/dual-role";
import type { ProfileRow, RepairProRow } from "@/lib/supabase/types";
import type { AccountType, ProService, UserProfile } from "@/lib/types";
import { isProService } from "@/lib/services";
import { listUserRoles, type RoleType } from "./identity-sync";

/** Internal projection: keep switch-specific selects, precedence and output fields. */
export async function loadSwitchedIdentityProfile(
  admin: SupabaseClient,
  userId: string,
  role: RoleType,
  profileRow: ProfileRow,
) {
  const accountType: AccountType =
    role === "repair_pro" ? "professional" : "motorist";

  let extras: {
    services?: ProService[];
    businessName?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    bio?: string;
    yearsExperience?: string;
    serviceRadiusKm?: number;
    ninVerified?: boolean;
    bvnVerified?: boolean;
    phoneVerified?: boolean;
    docsStatus?: UserProfile["docsStatus"];
    govIdVerified?: boolean;
    identityReviewStatus?: UserProfile["identityReviewStatus"];
    identityVerifiedAt?: string;
    identitySubmittedAt?: string;
    govIdKind?: string;
    govIdFrontUrl?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankCode?: string;
  } = {};

  // Load both side tables so bank can be merged either way on switch
  const [{ data: pro }, { data: mot }] = await Promise.all([
    admin
      .from("repair_pro_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("motorist_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  const pr = pro as RepairProRow | null;
  const motRow = mot as {
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    vehicle_year?: string | null;
    nin_verified?: boolean;
    bvn_verified?: boolean;
    phone_verified?: boolean;
    gov_id_verified?: boolean;
    identity_review_status?: string | null;
    identity_verified_at?: string | null;
    identity_submitted_at?: string | null;
    gov_id_kind?: string | null;
    gov_id_front_url?: string | null;
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    bank_code?: string | null;
  } | null;
  const proBank = pr as {
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    bank_code?: string | null;
    phone_verified?: boolean;
    docs_status?: string | null;
  } | null;

  // Shared identity phone flag (must survive Tap to Switch)
  const phoneVerified = Boolean(
    (profileRow as { phone_verified?: boolean }).phone_verified ||
    motRow?.phone_verified ||
    proBank?.phone_verified,
  );

  // Customer identity (T2) must survive C→Pro switch so Pro does not re-ask ID
  const motIdentityStatus = motRow?.identity_review_status;
  const identityStatus: UserProfile["identityReviewStatus"] | undefined =
    motIdentityStatus === "none" ||
    motIdentityStatus === "submitted" ||
    motIdentityStatus === "approved" ||
    motIdentityStatus === "rejected"
      ? motIdentityStatus
      : undefined;
  const identityFromCustomer: {
    govIdVerified: boolean;
    identityReviewStatus?: UserProfile["identityReviewStatus"];
    identityVerifiedAt?: string;
    identitySubmittedAt?: string;
    govIdKind?: string;
    govIdFrontUrl?: string;
  } = {
    govIdVerified: Boolean(motRow?.gov_id_verified),
    identityReviewStatus: identityStatus,
    identityVerifiedAt: motRow?.identity_verified_at || undefined,
    identitySubmittedAt: motRow?.identity_submitted_at || undefined,
    govIdKind: motRow?.gov_id_kind || undefined,
    govIdFrontUrl: motRow?.gov_id_front_url || undefined,
  };

  if (accountType === "professional") {
    const ds = proBank?.docs_status;
    extras = {
      services:
        (pr?.services as ProService[])?.filter(isProService) ||
        (pr?.primary_service && isProService(pr.primary_service)
          ? [pr.primary_service]
          : ["mechanic"]),
      businessName: pr?.business_name || undefined,
      bio: pr?.bio || undefined,
      yearsExperience: pr?.years_experience || undefined,
      serviceRadiusKm: pr?.service_radius_km,
      // Prefer pro flags; fall back to customer NIN/BVN when pro not set
      ninVerified: pr?.nin_verified || motRow?.nin_verified,
      bvnVerified: pr?.bvn_verified || motRow?.bvn_verified,
      phoneVerified,
      docsStatus:
        ds === "none" ||
        ds === "under_review" ||
        ds === "approved" ||
        ds === "rejected"
          ? ds
          : undefined,
      // Carry Customer T2 identity so Pro onboarding can skip gov ID
      ...identityFromCustomer,
      // Prefer pro bank; fall back to customer bank on same login
      bankName: proBank?.bank_name || motRow?.bank_name || undefined,
      bankAccountName:
        proBank?.bank_account_name || motRow?.bank_account_name || undefined,
      bankAccountNumber:
        proBank?.bank_account_number ||
        motRow?.bank_account_number ||
        undefined,
      bankCode: proBank?.bank_code || motRow?.bank_code || undefined,
    };
  } else {
    extras = {
      vehicleMake: motRow?.vehicle_make || undefined,
      vehicleModel: motRow?.vehicle_model || undefined,
      vehicleYear: motRow?.vehicle_year || undefined,
      ninVerified: motRow?.nin_verified,
      bvnVerified: motRow?.bvn_verified,
      phoneVerified,
      ...identityFromCustomer,
      bankName: motRow?.bank_name || proBank?.bank_name || undefined,
      bankAccountName:
        motRow?.bank_account_name || proBank?.bank_account_name || undefined,
      bankAccountNumber:
        motRow?.bank_account_number ||
        proBank?.bank_account_number ||
        undefined,
      bankCode: motRow?.bank_code || proBank?.bank_code || undefined,
    };
  }

  // Dual flags + primary = original signup (earlier side-table)
  const [{ data: motExists }, { data: proExists }] = await Promise.all([
    admin
      .from("motorist_profiles")
      .select("user_id, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("repair_pro_profiles")
      .select("user_id, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const hasMotorist = Boolean(motExists);
  const hasPro = Boolean(proExists);
  const storedPrimary = dbRoleToAccountType(
    (profileRow as ProfileRow).primary_role,
  );
  const primaryAccountType =
    storedPrimary ||
    resolvePrimaryAccountType({
      hasMotorist,
      hasPro,
      motoristCreatedAt: (motExists as { created_at?: string } | null)
        ?.created_at,
      proCreatedAt: (proExists as { created_at?: string } | null)?.created_at,
      activeAccountType: accountType,
    });

  const lastRoleSwitchAt =
    (profileRow as ProfileRow).last_role_switch_at || undefined;
  const roleSwitchCount = Number(
    (profileRow as ProfileRow).role_switch_count || 0,
  );

  const userProfile = profileToUserProfile(profileRow, {
    accountType,
    primaryAccountType,
    dualRole: hasMotorist && hasPro,
    lastRoleSwitchAt,
    roleSwitchCount,
    ...extras,
  });

  const roles = await listUserRoles(admin, userId);

  return {
    userId,
    accountType,
    role,
    roles,
    hasMotorist,
    hasPro,
    dualRole: hasMotorist && hasPro,
    primaryAccountType,
    lastRoleSwitchAt: lastRoleSwitchAt || null,
    roleSwitchCount,
    userProfile,
    profile: {
      id: profileRow.id,
      role: profileRow.role,
      full_name: profileRow.full_name,
      phone: profileRow.phone,
      email: profileRow.email,
      city: profileRow.city,
      area: profileRow.area,
      is_active: profileRow.is_active,
      created_at: profileRow.created_at,
      updated_at: profileRow.updated_at,
      avatar_url: profileRow.avatar_url,
    },
  };
}
