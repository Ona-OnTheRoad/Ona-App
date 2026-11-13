import "server-only";
import { apiFail } from "@/lib/server/api-json";
import type { SignupContext, VerifiedFlags } from "@/lib/server/signup/context";
import { last4, logSignupEvent } from "@/lib/server/signup/helpers";
import { deriveProFields } from "@/lib/server/signup/pro-fields";

/** Writes the Repair Pro side table and guarantor. Returns the stored flags, or the failure to send. */
export async function writeProProfile(
  ctx: SignupContext,
  userId: string,
  keepOther: boolean,
): Promise<VerifiedFlags | Response> {
  const { supabase, input, nin, bvn, hasNin, hasBvn, eventBase } = ctx;
  let ninVerifiedOut = false;
  let bvnVerifiedOut = false;
  if (!keepOther) {
    await supabase.from("motorist_profiles").delete().eq("user_id", userId);
  }
  const {
    svc,
    servicesList,
    labourPrices,
    vehicleFocus,
    certName,
    certUrl,
    hasCert,
    docsStatus,
    skillsSlim,
  } = await deriveProFields(input);

  const nowIso = new Date().toISOString();

  // ── Preserve an already-approved pro on re-signup / dual-role attach ─────
  // Re-running signup for an existing account must NEVER downgrade a pro that
  // Care already approved (T2+). Clobbering visibility_tier → 1 (and status →
  // pending, gov_id_review_status → submitted) locked approved pros out of Go
  // Live with "Tier 1: set up your profile. Admin must approve Tier 2".
  const { data: existingPro } = await supabase
    .from("repair_pro_profiles")
    .select(
      "status, pipeline_status, docs_status, docs_rating_boost_applied, gov_id_review_status, gov_id_submitted_at, gov_id_kind, gov_id_number, gov_id_front_url, gov_id_back_url, gov_id_meta, verified, nin_verified, bvn_verified, nin_encrypted, bvn_encrypted, visibility_tier, is_new_artisan, tier2_approved_at, tier3_approved_at, tier4_approved_at, go_live_window_ends_at, skill_proof, certification_file_name, certification_file_url",
    )
    .eq("user_id", userId)
    .maybeSingle();
  const wasApproved =
    existingPro?.gov_id_review_status === "approved" ||
    existingPro?.verified === true ||
    Boolean(existingPro?.tier2_approved_at) ||
    Number(existingPro?.visibility_tier) >= 2;
  const docsWasApproved = existingPro?.docs_status === "approved";
  const keepExistingVis = Number(existingPro?.visibility_tier);
  const effectiveVis =
    wasApproved && Number.isFinite(keepExistingVis) && keepExistingVis >= 2
      ? keepExistingVis
      : 2;

  ninVerifiedOut = wasApproved && Boolean(existingPro?.nin_verified);
  bvnVerifiedOut = wasApproved && Boolean(existingPro?.bvn_verified);

  // Care must review never auto-approve ID/account from raw NIN/BVN digits alone
  const { error: proErr } = await supabase.from("repair_pro_profiles").upsert(
    {
      user_id: userId,
      business_name: input.businessName || null,
      primary_service: svc,
      services: servicesList.length ? servicesList : [svc],
      // Approved pros keep approved; new / re-pending pros enter review
      status: wasApproved ? "approved" : "pending",
      pipeline_status: wasApproved
        ? existingPro?.pipeline_status || "live_ready"
        : hasCert
          ? "pending_document_review"
          : hasNin || hasBvn
            ? "pending_verification"
            : "draft",
      // Stay Away until the pro taps Live on the dashboard
      is_online: false,
      bio: input.bio || null,
      years_experience: input.yearsExperience || null,
      service_radius_km: input.serviceRadiusKm ?? 10,
      // Home / signup pin (live pin updated again on Go Live)
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      location_updated_at:
        input.lat != null && input.lng != null ? nowIso : null,
      // Visibility ladder: Tier 1 until admin promotes never downgrade approved
      visibility_tier: wasApproved ? effectiveVis : 1,
      is_new_artisan: wasApproved
        ? existingPro?.is_new_artisan !== false
        : true,
      verified: wasApproved ? Boolean(existingPro?.verified) : false,
      nin_last4: last4(nin),
      bvn_last4: last4(bvn),
      // Preserve approved identity data when re-signup sends no fresh digits
      nin_encrypted: hasNin ? nin : (existingPro?.nin_encrypted ?? null),
      bvn_encrypted: hasBvn ? bvn : (existingPro?.bvn_encrypted ?? null),
      // Digits collected ≠ care-approved (unless already approved)
      nin_verified: ninVerifiedOut,
      bvn_verified: bvnVerifiedOut,
      gov_id_number: hasNin ? nin : (existingPro?.gov_id_number ?? null),
      gov_id_review_status: wasApproved
        ? "approved"
        : hasNin || hasBvn
          ? "submitted"
          : "none",
      gov_id_submitted_at: wasApproved
        ? (existingPro?.gov_id_submitted_at ?? null)
        : hasNin || hasBvn
          ? nowIso
          : null,
      // Preserve tier timestamps + Go Live window + stored ID media for approved pros
      ...(wasApproved
        ? {
            gov_id_kind: existingPro?.gov_id_kind ?? null,
            gov_id_front_url: existingPro?.gov_id_front_url ?? null,
            gov_id_back_url: existingPro?.gov_id_back_url ?? null,
            gov_id_meta: existingPro?.gov_id_meta ?? {},
            tier2_approved_at: existingPro?.tier2_approved_at ?? null,
            tier3_approved_at: existingPro?.tier3_approved_at ?? null,
            tier4_approved_at: existingPro?.tier4_approved_at ?? null,
            go_live_window_ends_at:
              existingPro?.go_live_window_ends_at ?? null,
          }
        : {}),
      labour_prices: labourPrices,
      pricing_currency: input.pricingCurrency || "NGN",
      vehicle_focus: vehicleFocus,
      skills: skillsSlim,
      skill_proof:
        docsWasApproved && existingPro?.skill_proof
          ? existingPro.skill_proof
          : hasCert
            ? {
                type: "certification",
                name: certName,
                url: certUrl,
                submittedAt: nowIso,
                status: "under_review",
              }
            : null,
      bank_name: input.bankName || null,
      bank_account_name: input.bankAccountName || null,
      bank_account_number: input.bankAccountNumber || null,
      bank_code: input.bankCode || null,
      docs_status: docsWasApproved ? "approved" : docsStatus,
      docs_rating_boost_applied: docsWasApproved
        ? existingPro?.docs_rating_boost_applied === true
        : false,
      certification_file_name:
        certName ||
        (docsWasApproved
          ? (existingPro?.certification_file_name ?? null)
          : null),
      // Prefer slim URL; if oversized, keep name only so signup still succeeds
      certification_file_url:
        certUrl ||
        (docsWasApproved
          ? (existingPro?.certification_file_url ?? null)
          : null),
      docs_submitted_at: hasCert ? nowIso : null,
      submitted_at: nowIso,
    },
    { onConflict: "user_id" },
  );
  if (proErr) {
    await logSignupEvent(supabase, {
      ...eventBase,
      success: false,
      error_message: proErr.message,
      user_id: userId,
      meta: { stage: "repair_pro_profiles" },
    });
    return apiFail(
      `Repair Pro profile failed: ${proErr.message}`,
      500,
      "pro_profile_error",
    );
  }

  // Insert guarantor for Repair Pro (compulsory)
  if (input.guarantor) {
    try {
      await supabase.from("repair_pro_guarantors").upsert(
        {
          user_id: userId,
          full_name: input.guarantor.fullName,
          phone: input.guarantor.phone,
          address: input.guarantor.address || null,
          occupation: input.guarantor.occupation || null,
          relationship: input.guarantor.relationship,
        },
        { onConflict: "user_id" },
      );
    } catch {
      /* non-fatal - table may not exist yet */
    }
  }

  return { ninVerified: ninVerifiedOut, bvnVerified: bvnVerifiedOut };
}
