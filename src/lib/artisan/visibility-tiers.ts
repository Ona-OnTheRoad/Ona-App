/**
 * Repair Pro search-visibility ladder (automatic only care never sets Vis manually).
 *
 * Product lock:
 * T1 registered; hidden from search; no Go Live
 * T2 after care approves government ID → limited search (~30% · 1 km · 30-day Go Live window)
 * T3 after face liveness + BVN verified (and T2 done) → wider search (~70% · 3 km · no 30-day cap · New badge off)
 * T4 after skill docs approved, and only if T3 already passed → full (~100% · 5 km)
 *
 * Motorists are not on this ladder (pros only).
 */
export {
  TIER2_GO_LIVE_DAYS,
  TIER2_WARN_DAYS_BEFORE,
  TIER2_MAX_RADIUS_KM,
  TIER3_MAX_RADIUS_KM,
  TIER4_MAX_RADIUS_KM,
  VISIBILITY_TIER_RULES,
  clampVisibilityTier,
  rulesForTier,
  resolveVisibilityTier,
  addDaysIso,
  daysRemainingUntil,
} from "./visibility-tiers/rules";
export type {
  VisibilityTier,
  VisibilityTierRules,
} from "./visibility-tiers/rules";
export {
  resolveAutoVisibilityTier,
  autoVisibilityFromProRow,
  effectiveGoLiveTier,
  visibilityPromotionPatch,
} from "./visibility-tiers/auto";
export {
  canGoLiveForVisibilityTier,
  tier2GoLiveWarning,
} from "./visibility-tiers/go-live";
export {
  visibilityScoreMultiplier,
  visibilitySoftPenalty,
  passesAppearChance,
  applyAdminTierPromotion,
  maybeSeedTier4OneStar,
} from "./visibility-tiers/ranking";
