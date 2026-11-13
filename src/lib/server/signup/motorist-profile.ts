import "server-only";
import { apiFail } from "@/lib/server/api-json";
import { isMotoristT2ApprovedLocked } from "@/lib/server/identity/protect-approval";
import type { SignupContext, VerifiedFlags } from "@/lib/server/signup/context";
import { last4, logSignupEvent } from "@/lib/server/signup/helpers";

/** Writes the customer side table. Returns the stored flags, or the failure to send. */
export async function writeMotoristProfile(
  ctx: SignupContext,
  userId: string,
  keepOther: boolean,
): Promise<VerifiedFlags | Response> {
  const { supabase, input, nin, bvn, eventBase } = ctx;
  let ninVerifiedOut = false;
  let bvnVerifiedOut = false;
  if (!keepOther) {
    await supabase.from("repair_pro_profiles").delete().eq("user_id", userId);
  }
  const vehiclesJson =
    Array.isArray(input.vehicles) && input.vehicles.length > 0
      ? input.vehicles
      : input.vehicleMake || input.vehicleModel
        ? [
            {
              id: `veh-${userId.slice(0, 8)}`,
              make: input.vehicleMake || "",
              model: input.vehicleModel || "",
              year: input.vehicleYear || undefined,
              plate: input.plateNumber || undefined,
              photo: input.vehiclePhoto || undefined,
              commonIssues: input.vehicleCommonIssues || undefined,
            },
          ]
        : [];
  const firstVeh = vehiclesJson[0] as
    | {
        make?: string;
        model?: string;
        year?: string;
        plate?: string;
        photo?: string;
        commonIssues?: string[];
      }
    | undefined;

  // Digits collected ≠ Care-approved. Only an existing Care approval keeps
  // its flags (re-signup / dual-role attach must never downgrade it).
  const { data: existingMot } = await supabase
    .from("motorist_profiles")
    .select("identity_review_status, identity_verified_at, nin_verified, bvn_verified")
    .eq("user_id", userId)
    .maybeSingle();
  const motApproved = isMotoristT2ApprovedLocked(existingMot);
  ninVerifiedOut = motApproved && Boolean(existingMot?.nin_verified);
  bvnVerifiedOut = motApproved && Boolean(existingMot?.bvn_verified);

  const { error: motErr } = await supabase.from("motorist_profiles").upsert(
    {
      user_id: userId,
      vehicle_make: firstVeh?.make || input.vehicleMake || null,
      vehicle_model: firstVeh?.model || input.vehicleModel || null,
      vehicle_year: firstVeh?.year || input.vehicleYear || null,
      plate_number: firstVeh?.plate || input.plateNumber || null,
      vehicle_photo: firstVeh?.photo || input.vehiclePhoto || null,
      vehicle_common_issues:
        firstVeh?.commonIssues || input.vehicleCommonIssues || [],
      vehicles: vehiclesJson,
      emergency_contact: input.emergencyContact || null,
      address_text:
        [input.area, input.city].filter(Boolean).join(", ") || null,
      default_lat: input.lat ?? null,
      default_lng: input.lng ?? null,
      location_updated_at:
        input.lat != null && input.lng != null
          ? new Date().toISOString()
          : null,
      nin_last4: last4(nin),
      bvn_last4: last4(bvn),
      nin_verified: ninVerifiedOut,
      bvn_verified: bvnVerifiedOut,
      identity_verified_at: motApproved
        ? (existingMot?.identity_verified_at ?? null)
        : null,
    },
    { onConflict: "user_id" },
  );
  if (motErr) {
    await logSignupEvent(supabase, {
      ...eventBase,
      success: false,
      error_message: motErr.message,
      user_id: userId,
      meta: { stage: "motorist_profiles" },
    });
    return apiFail(
      `Customer profile failed: ${motErr.message}`,
      500,
      "motorist_profile_error",
    );
  }

  return { ninVerified: ninVerifiedOut, bvnVerified: bvnVerifiedOut };
}
