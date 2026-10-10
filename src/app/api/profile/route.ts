import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  profileToUserProfile,
  resolvePrimaryAccountType,
} from "@/lib/supabase/mappers";
import type { ProfileRow, RepairProRow } from "@/lib/supabase/types";
import type { AccountType, ProService, UserProfile } from "@/lib/types";

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
    const sb = createServiceSupabase();
    const { data: profile } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!profile) return apiOk({ profile: null });

    const p = profile as ProfileRow;
    const accountType: AccountType =
      p.role === "repair_pro" ? "professional" : "motorist";

    const [motRes, proRes, guarantorRes] = await Promise.all([
      sb
        .from("motorist_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      sb
        .from("repair_pro_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      sb
        .from("repair_pro_guarantors")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const mot = motRes.data as {
      vehicle_make?: string | null;
      vehicle_model?: string | null;
      vehicle_year?: string | null;
      plate_number?: string | null;
      vehicle_photo?: string | null;
      vehicle_common_issues?: string[] | null;
      vehicles?: UserProfile["vehicles"];
      nin_last4?: string | null;
      bvn_last4?: string | null;
      nin_verified?: boolean;
      bvn_verified?: boolean;
      identity_verified_at?: string | null;
      identity_review_status?: string | null;
      identity_submitted_at?: string | null;
      gov_id_kind?: string | null;
      gov_id_front_url?: string | null;
      phone_verified?: boolean;
      first_service_at?: string | null;
      created_at?: string;
      bank_name?: string | null;
      bank_account_name?: string | null;
      bank_account_number?: string | null;
      bank_code?: string | null;
    } | null;
    const pr = proRes.data as
      | (RepairProRow & {
          bank_name?: string | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_code?: string | null;
        })
      | null;
    const storedPrimary = (() => {
      const prRole = (p as { primary_role?: string | null }).primary_role;
      if (prRole === "repair_pro") return "professional" as const;
      if (prRole === "motorist") return "motorist" as const;
      return null;
    })();
    const primaryAccountType =
      storedPrimary ||
      resolvePrimaryAccountType({
        hasMotorist: Boolean(mot),
        hasPro: Boolean(pr),
        motoristCreatedAt: mot?.created_at,
        proCreatedAt: pr?.created_at,
        activeAccountType: accountType,
      });
    const dualRole = Boolean(mot) && Boolean(pr);
    const lastRoleSwitchAt =
      (p as { last_role_switch_at?: string | null }).last_role_switch_at ||
      undefined;
    const roleSwitchCount = Number(
      (p as { role_switch_count?: number | null }).role_switch_count || 0,
    );

    if (accountType === "professional") {
      const proExtra = pr as
        | (RepairProRow & {
            labour_prices?: UserProfile["servicePrices"];
            pricing_currency?: import("@/lib/pricing").AppCurrency;
            jobs_completed?: number;
            vehicle_focus?: Record<string, string | undefined>;
          })
        | null;
      const vf = (proExtra?.vehicle_focus || {}) as Record<
        string,
        string | undefined
      >;
      const profileOut = profileToUserProfile(p, {
        accountType,
        primaryAccountType,
        dualRole,
        lastRoleSwitchAt,
        roleSwitchCount,
        services:
          (pr?.services as ProService[]) ||
          (pr?.primary_service ? [pr.primary_service as ProService] : []),
        businessName: pr?.business_name || undefined,
        bio: pr?.bio || undefined,
        yearsExperience: pr?.years_experience || undefined,
        serviceRadiusKm: pr?.service_radius_km,
        ninVerified: pr?.nin_verified,
        bvnVerified: pr?.bvn_verified,
        docsStatus:
          (pr?.docs_status as UserProfile["docsStatus"]) || "approved",
        docsRatingBoostApplied: Boolean(pr?.docs_rating_boost_applied),
        certificationFileName: pr?.certification_file_name || undefined,
        certificationFileDataUrl: pr?.certification_file_url || undefined,
        skillAnswers: (pr?.skills as UserProfile["skillAnswers"]) || undefined,
        averageRating: pr ? Number(pr.rating_avg) || undefined : undefined,
        jobsCompleted: proExtra?.jobs_completed,
        servicePrices: proExtra?.labour_prices,
        pricingCurrency: proExtra?.pricing_currency,
        servedVehicleType: vf.servedVehicleType,
        servedBrand: vf.servedBrand,
        servedModel: vf.servedModel,
        servedCountry: vf.servedCountry,
        servedLocation: vf.servedLocation,
        bankName: pr?.bank_name || mot?.bank_name || undefined,
        bankAccountName:
          pr?.bank_account_name || mot?.bank_account_name || undefined,
        bankAccountNumber:
          pr?.bank_account_number || mot?.bank_account_number || undefined,
        bankCode: pr?.bank_code || mot?.bank_code || undefined,
        guarantor: guarantorRes.data
          ? (() => {
              const g = guarantorRes.data as {
                full_name?: string | null;
                phone?: string | null;
                address?: string | null;
                occupation?: string | null;
                relationship?: string | null;
                linked_user_id?: string | null;
              };
              return {
                fullName: g.full_name || "",
                phone: g.phone || "",
                address: g.address || undefined,
                occupation: g.occupation || undefined,
                relationship: g.relationship || "",
                linkedUserId: g.linked_user_id || undefined,
              };
            })()
          : undefined,
        phoneVerified:
          Boolean((p as { phone_verified?: boolean }).phone_verified) ||
          Boolean(mot?.phone_verified),
      });
      return apiOk({ profile: profileOut });
    }

    const reviewStatus = (mot?.identity_review_status ||
      (mot?.identity_verified_at
        ? "approved"
        : mot?.nin_last4 || mot?.bvn_last4
          ? "submitted"
          : "none")) as UserProfile["identityReviewStatus"];

    const profileOut = profileToUserProfile(p, {
      accountType,
      primaryAccountType,
      dualRole,
      lastRoleSwitchAt,
      roleSwitchCount,
      vehicleMake: mot?.vehicle_make || undefined,
      vehicleModel: mot?.vehicle_model || undefined,
      vehicleYear: mot?.vehicle_year || undefined,
      vehiclePlate: mot?.plate_number || undefined,
      vehiclePhoto: mot?.vehicle_photo || undefined,
      vehicleCommonIssues: mot?.vehicle_common_issues || undefined,
      vehicles: Array.isArray(mot?.vehicles) ? mot.vehicles : undefined,
      ninVerified: Boolean(mot?.nin_verified),
      bvnVerified: Boolean(mot?.bvn_verified),
      govIdVerified:
        reviewStatus === "approved" || Boolean(mot?.identity_verified_at),
      identityVerifiedAt: mot?.identity_verified_at || undefined,
      identityReviewStatus: reviewStatus,
      identitySubmittedAt: mot?.identity_submitted_at || undefined,
      govIdKind: mot?.gov_id_kind || undefined,
      govIdFrontUrl: mot?.gov_id_front_url || undefined,
      phoneVerified:
        Boolean((p as { phone_verified?: boolean }).phone_verified) ||
        Boolean(mot?.phone_verified),
      firstServiceAt: mot?.first_service_at || undefined,
      bankName: mot?.bank_name || pr?.bank_name || undefined,
      bankAccountName:
        mot?.bank_account_name || pr?.bank_account_name || undefined,
      bankAccountNumber:
        mot?.bank_account_number || pr?.bank_account_number || undefined,
      bankCode: mot?.bank_code || pr?.bank_code || undefined,
    });
    return apiOk({ profile: profileOut });
  } catch (e) {
    return apiFail(
      e instanceof Error ? e.message : "Could not load profile",
      500,
    );
  }
}
