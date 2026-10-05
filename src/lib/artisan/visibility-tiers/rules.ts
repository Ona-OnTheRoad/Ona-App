import type { ArtisanVerificationProfile } from "@/lib/artisan/types";

export type VisibilityTier = 1 | 2 | 3 | 4;

export const TIER2_GO_LIVE_DAYS = 30;
export const TIER2_WARN_DAYS_BEFORE = 5;
/** Tier 2 discovery radius wide enough that Live pros are findable (was 1 km, too strict) */
export const TIER2_MAX_RADIUS_KM = 5;
export const TIER3_MAX_RADIUS_KM = 5;
export const TIER4_MAX_RADIUS_KM = 5;

export type VisibilityTierRules = {
  tier: VisibilityTier;
  /** 0-100 marketplace visibility weight */
  visibilityPercent: number;
  /** Max km motorists may discover this pro */
  maxRadiusKm: number;
  canAppearInSearch: boolean;
  canGoLive: boolean;
  /** Soft days of Go Live after Tier 2 approval (null = unlimited) */
  goLiveWindowDays: number | null;
  warnDaysBeforeExpiry: number | null;
  showNewBadge: boolean;
  /** Tier 4: add one 1★ review only if they already have ≥1 rating */
  seedOneStarIfHasRatings: boolean;
};

export const VISIBILITY_TIER_RULES: Record<
  VisibilityTier,
  VisibilityTierRules
> = {
  1: {
    tier: 1,
    visibilityPercent: 0,
    maxRadiusKm: 0,
    canAppearInSearch: false,
    canGoLive: false,
    goLiveWindowDays: null,
    warnDaysBeforeExpiry: null,
    showNewBadge: true,
    seedOneStarIfHasRatings: false,
  },
  2: {
    tier: 2,
    visibilityPercent: 30,
    maxRadiusKm: TIER2_MAX_RADIUS_KM,
    canAppearInSearch: true,
    canGoLive: true,
    goLiveWindowDays: TIER2_GO_LIVE_DAYS,
    warnDaysBeforeExpiry: TIER2_WARN_DAYS_BEFORE,
    showNewBadge: true,
    seedOneStarIfHasRatings: false,
  },
  3: {
    tier: 3,
    visibilityPercent: 70,
    maxRadiusKm: TIER3_MAX_RADIUS_KM,
    canAppearInSearch: true,
    canGoLive: true,
    goLiveWindowDays: null,
    warnDaysBeforeExpiry: null,
    showNewBadge: false,
    seedOneStarIfHasRatings: false,
  },
  4: {
    tier: 4,
    visibilityPercent: 100,
    maxRadiusKm: TIER4_MAX_RADIUS_KM,
    canAppearInSearch: true,
    canGoLive: true,
    goLiveWindowDays: null,
    warnDaysBeforeExpiry: null,
    showNewBadge: false,
    seedOneStarIfHasRatings: true,
  },
};

export function clampVisibilityTier(
  n: number | null | undefined,
): VisibilityTier {
  const t = Math.floor(Number(n) || 1);
  if (t <= 1) return 1;
  if (t === 2) return 2;
  if (t === 3) return 3;
  return 4;
}

export function rulesForTier(tier: VisibilityTier): VisibilityTierRules {
  return VISIBILITY_TIER_RULES[clampVisibilityTier(tier)];
}

/** Effective visibility tier from artisan profile (defaults to 1). */
export function resolveVisibilityTier(
  p:
    | (Pick<ArtisanVerificationProfile, "visibilityTier" | "status"> &
        Partial<
          Pick<ArtisanVerificationProfile, "tiers" | "govIdReviewStatus">
        >)
    | null
    | undefined,
): VisibilityTier {
  if (!p) return 1;
  let tier =
    p.visibilityTier != null
      ? clampVisibilityTier(p.visibilityTier)
      : p.status === "approved"
        ? 2
        : 1;
  // Care-approved T2 must never still read as Tier 1
  if (p.govIdReviewStatus === "approved" || Boolean(p.tiers?.tier2_govId)) {
    tier = Math.max(tier, 2) as VisibilityTier;
  }
  if (Boolean(p.tiers?.tier3_liveness)) {
    tier = Math.max(tier, 3) as VisibilityTier;
  }
  if (Boolean(p.tiers?.tier4_skillProof)) {
    tier = Math.max(tier, 4) as VisibilityTier;
  }
  return tier;
}

export function addDaysIso(fromIso: string, days: number): string {
  const d = new Date(fromIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function daysRemainingUntil(
  iso: string | null | undefined,
): number | null {
  if (!iso) return null;
  const end = Date.parse(iso);
  if (!Number.isFinite(end)) return null;
  const ms = end - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
