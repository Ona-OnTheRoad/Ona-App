import { clampVisibilityTier, type VisibilityTier } from "./rules";

/** Pure auto ladder from verification flags (source of truth for tier number). */
export function resolveAutoVisibilityTier(input: {
  /** Care approved government ID (T2) */
  govIdApproved: boolean;
  /** BVN verified (required with liveness for T3) */
  bvnVerified: boolean;
  /** Face liveness passed */
  faceLiveness: boolean;
  /** Care approved skill documents (T4) */
  skillDocsApproved: boolean;
}): VisibilityTier {
  const t2 = Boolean(input.govIdApproved);
  const t3 = t2 && Boolean(input.bvnVerified) && Boolean(input.faceLiveness);
  const t4 = t3 && Boolean(input.skillDocsApproved);
  if (t4) return 4;
  if (t3) return 3;
  if (t2) return 2;
  return 1;
}

/** DB row shape → auto tier */
export function autoVisibilityFromProRow(pro: {
  gov_id_review_status?: string | null;
  verified?: boolean | null;
  nin_verified?: boolean | null;
  bvn_verified?: boolean | null;
  face_liveness_verified?: boolean | null;
  liveness_passed_at?: string | null;
  docs_status?: string | null;
}): VisibilityTier {
  const govIdApproved =
    pro.gov_id_review_status === "approved" ||
    Boolean(pro.verified) ||
    Boolean(pro.nin_verified);
  return resolveAutoVisibilityTier({
    govIdApproved,
    bvnVerified: Boolean(pro.bvn_verified),
    faceLiveness: Boolean(pro.face_liveness_verified || pro.liveness_passed_at),
    skillDocsApproved: pro.docs_status === "approved",
  });
}

/**
 * Effective tier for the Go Live gate a single, safe read.
 *
 * Care-approved T2 flags (or a stored tier2_approved_at) ALWAYS dominate a stale,
 * missing, or clobbered `visibility_tier` column. This prevents the "approved for
 * Tier 2 but the app still says Tier 1" desync class (e.g. a signup upsert that
 * reset visibility_tier → 1 after approval). Never used to upgrade beyond what the
 * auto ladder + stored tier agree on otherwise.
 */
export function effectiveGoLiveTier(
  pro: Record<string, unknown> | null | undefined,
): VisibilityTier {
  // Legacy rows (pre-visibility_tier migration) have no stored tier default 2
  // so existing approved pros are never locked out (same as the old ?? 2 gate).
  const rawVis = pro?.visibility_tier;
  const stored = rawVis == null ? 2 : clampVisibilityTier(Number(rawVis));
  const auto = autoVisibilityFromProRow({
    gov_id_review_status:
      (pro?.gov_id_review_status as string | null | undefined) || null,
    verified: pro?.verified as boolean | null | undefined,
    nin_verified: pro?.nin_verified as boolean | null | undefined,
    bvn_verified: pro?.bvn_verified as boolean | null | undefined,
    face_liveness_verified: pro?.face_liveness_verified as
      boolean | null | undefined,
    liveness_passed_at:
      (pro?.liveness_passed_at as string | null | undefined) || null,
    docs_status: (pro?.docs_status as string | null | undefined) || null,
  });
  // Approval floor: any care-approved signal (or approved account status) means
  // this pro is marketplace-ready and can never read as hidden Tier 1, even if a
  // stale write reset visibility_tier to 1.
  const approved =
    pro?.status === "approved" ||
    pro?.gov_id_review_status === "approved" ||
    pro?.verified === true ||
    pro?.nin_verified === true ||
    Boolean(pro?.tier2_approved_at);
  const base = approved ? Math.max(stored, 2) : stored;
  return Math.max(base, auto) as VisibilityTier;
}

/** Patch fields when auto-promoting visibility (timestamps, new badge, go-live window). */
export function visibilityPromotionPatch(
  nextTier: VisibilityTier,
  nowIso: string,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    visibility_tier: nextTier,
    is_new_artisan: nextTier <= 2,
    updated_at: nowIso,
  };
  if (nextTier >= 2) {
    patch.tier2_approved_at = nowIso; // caller may overwrite if already set
  }
  if (nextTier >= 3) {
    patch.tier3_approved_at = nowIso;
    patch.go_live_window_ends_at = null; // unlimited Go Live from T3
  }
  if (nextTier >= 4) {
    patch.tier4_approved_at = nowIso;
    patch.go_live_window_ends_at = null;
  }
  return patch;
}
