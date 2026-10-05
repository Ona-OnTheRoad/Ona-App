import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import { TIER2_GO_LIVE_DAYS, addDaysIso } from "./rules";

/**
 * Ranking: (A) score × visibility%, (C) extra soft penalty for lower visibility.
 * (B) appear chance applied separately when filtering the list.
 */
export function visibilityScoreMultiplier(percent: number): number {
  const p = Math.max(0, Math.min(100, percent)) / 100;
  return p;
}

/** Soft rank penalty points for incomplete visibility (C) */
export function visibilitySoftPenalty(percent: number): number {
  const missing = Math.max(0, 100 - Math.max(0, Math.min(100, percent)));
  return missing * 0.35; // up to 35 pts at 0%
}

/**
 * Stochastic filter (B): each pro appears with probability = visibility%.
 * Seeded by pro id + hour so lists stay stable within a short window.
 */
export function passesAppearChance(
  proId: string,
  visibilityPercent: number,
  nowMs: number = Date.now(),
): boolean {
  if (visibilityPercent >= 100) return true;
  if (visibilityPercent <= 0) return false;
  const hourBucket = Math.floor(nowMs / (60 * 60 * 1000));
  let h = 0;
  const s = `${proId}:${hourBucket}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const roll = (h % 10000) / 100; // 0-99.99
  return roll < visibilityPercent;
}

/** Apply admin promotion to a target tier (2-4). */
export function applyAdminTierPromotion(
  p: ArtisanVerificationProfile,
  target: 2 | 3 | 4,
  adminName: string,
): ArtisanVerificationProfile {
  const now = new Date().toISOString();
  const next: ArtisanVerificationProfile = {
    ...p,
    status: "approved",
    visibilityTier: target,
    reviewedAt: now,
    reviewedBy: adminName,
    rejectReason: null,
    updatedAt: now,
  };

  if (target >= 2) {
    next.tier2ApprovedAt = p.tier2ApprovedAt || now;
    if (target === 2 || !p.goLiveWindowEndsAt) {
      next.goLiveWindowEndsAt = addDaysIso(
        next.tier2ApprovedAt,
        TIER2_GO_LIVE_DAYS,
      );
    }
    next.isNewArtisan = true;
  }
  if (target >= 3) {
    next.tier3ApprovedAt = now;
    next.isNewArtisan = false;
    // Unlimited Go Live after Tier 3
    next.goLiveWindowEndsAt = null;
  }
  if (target >= 4) {
    next.tier4ApprovedAt = now;
    next.isNewArtisan = false;
    next.goLiveWindowEndsAt = null;
  }

  // Sync boolean tier completion flags for UI
  next.tiers = {
    ...p.tiers,
    tier1_phone: p.tiers.tier1_phone || true,
    tier2_govId: target >= 2 ? true : p.tiers.tier2_govId,
    tier2_nin: target >= 2 ? true : p.tiers.tier2_nin,
    tier3_liveness: target >= 3 ? true : p.tiers.tier3_liveness,
    tier4_skillProof: target >= 4 ? true : p.tiers.tier4_skillProof,
  };

  if (target >= 2) {
    next.govIdReviewStatus = "approved";
    next.ninReviewStatus = "approved";
  }

  return next;
}

/**
 * Tier 4: if pro already has ratings, append one 1★ seed once.
 * Returns new average/count or null if not applicable.
 */
export function maybeSeedTier4OneStar(input: {
  alreadySeeded?: boolean;
  ratingCount: number;
  ratingAvg: number;
}): { ratingAvg: number; ratingCount: number; seeded: true } | null {
  if (input.alreadySeeded) return null;
  if (!Number.isFinite(input.ratingCount) || input.ratingCount < 1) return null;
  const count = input.ratingCount + 1;
  const sum = input.ratingAvg * input.ratingCount + 1;
  return {
    ratingAvg: Math.round((sum / count) * 10) / 10,
    ratingCount: count,
    seeded: true,
  };
}
