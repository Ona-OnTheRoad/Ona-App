import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { profileToUserProfile, resolvePrimaryAccountType } from "@/lib/supabase/mappers";
import type { ProfileRow, RepairProRow } from "@/lib/supabase/types";
import type { AccountType, ProService, UserProfile } from "@/lib/types";

export async function loadOrRepairLoginProfile(
  userId: string,
  email: string,
  meta: Record<string, unknown> | undefined,
): Promise<
  | {
      profile: UserProfile;
      hasMotorist: boolean;
      hasPro: boolean;
    }
  | { deactivated: true }
  | null
> {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createServiceSupabase();

  let { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    const roleRaw = String(meta?.role || meta?.account_type || "motorist");
    const role =
      roleRaw === "repair_pro" || roleRaw === "professional"
        ? "repair_pro"
        : "motorist";
    const fullName =
      String(meta?.full_name || meta?.fullName || "").trim() ||
      email.split("@")[0] ||
      "User";
    const phone = String(meta?.phone || "").trim() || null;

    const { data: inserted, error: insErr } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          role,
          full_name: fullName,
          phone,
          email: email.toLowerCase(),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select("*")
      .maybeSingle();

    if (insErr) {
      console.error("login profile repair failed", insErr.message);
    }
    profile = inserted;
  }

  if (!profile) return null;

  // Frozen / admin-deactivated accounts must stay blocked
  if ((profile as ProfileRow).is_active === false) {
    return { deactivated: true };
  }

  const p = profile as ProfileRow;
  const accountType: AccountType =
    p.role === "repair_pro" ? "professional" : "motorist";

  // Slim selects + bank (shared across Customer / Repair Pro on one login)
  const [motRes, proRes] = await Promise.all([
    admin
      .from("motorist_profiles")
      .select(
        "vehicle_make, vehicle_model, vehicle_year, plate_number, vehicle_photo, vehicle_common_issues, vehicles, nin_verified, bvn_verified, identity_verified_at, created_at, bank_name, bank_account_name, bank_account_number, bank_code",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("repair_pro_profiles")
      .select(
        "user_id, business_name, primary_service, services, years_experience, bio, service_radius_km, nin_verified, bvn_verified, docs_status, docs_rating_boost_applied, certification_file_name, certification_file_url, skills, rating_avg, jobs_completed, labour_prices, pricing_currency, vehicle_focus, created_at, bank_name, bank_account_name, bank_account_number, bank_code",
      )
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
    vehicles?: import("@/lib/types").MotoristVehicle[] | null;
    nin_verified?: boolean;
    bvn_verified?: boolean;
    identity_verified_at?: string | null;
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

  // One bank per login: either side can supply it
  const bankName = pr?.bank_name || mot?.bank_name || undefined;
  const bankAccountName =
    pr?.bank_account_name || mot?.bank_account_name || undefined;
  const bankAccountNumber =
    pr?.bank_account_number || mot?.bank_account_number || undefined;
  const bankCode = pr?.bank_code || mot?.bank_code || undefined;

  const primaryAccountType = resolvePrimaryAccountType({
    hasMotorist: Boolean(mot),
    hasPro: Boolean(pr),
    motoristCreatedAt: mot?.created_at,
    proCreatedAt: pr?.created_at,
    activeAccountType: accountType,
  });

  const hasMotorist = Boolean(mot) || accountType === "motorist";
  const hasPro = Boolean(pr) || accountType === "professional";

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
    return {
      profile: profileToUserProfile(p, {
        accountType,
        primaryAccountType,
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
        bankName: bankName || undefined,
        bankAccountName: bankAccountName || undefined,
        bankAccountNumber: bankAccountNumber || undefined,
        bankCode: bankCode || undefined,
      }),
      hasMotorist,
      hasPro,
    };
  }

  return {
    profile: profileToUserProfile(p, {
      accountType,
      primaryAccountType,
      vehicleMake: mot?.vehicle_make || undefined,
      vehicleModel: mot?.vehicle_model || undefined,
      vehicleYear: mot?.vehicle_year || undefined,
      vehiclePlate: mot?.plate_number || undefined,
      vehiclePhoto: mot?.vehicle_photo || undefined,
      vehicleCommonIssues: mot?.vehicle_common_issues || undefined,
      vehicles: Array.isArray(mot?.vehicles) ? mot.vehicles : undefined,
      ninVerified: Boolean(mot?.nin_verified),
      bvnVerified: Boolean(mot?.bvn_verified),
      identityVerifiedAt: mot?.identity_verified_at || undefined,
      bankName: bankName || undefined,
      bankAccountName: bankAccountName || undefined,
      bankAccountNumber: bankAccountNumber || undefined,
      bankCode: bankCode || undefined,
    }),
    hasMotorist,
    hasPro,
  };
}
