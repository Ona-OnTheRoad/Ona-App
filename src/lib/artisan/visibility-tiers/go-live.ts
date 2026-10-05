import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import {
  TIER2_GO_LIVE_DAYS,
  TIER2_WARN_DAYS_BEFORE,
  addDaysIso,
  daysRemainingUntil,
  resolveVisibilityTier,
  rulesForTier,
} from "./rules";

/**
 * Go Live gate for visibility tiers (on top of profile status).
 */
export function canGoLiveForVisibilityTier(
  p: ArtisanVerificationProfile | null | undefined,
): { allowed: true } | { allowed: false; message: string } {
  if (!p) {
    return {
      allowed: false,
      message:
        "Complete your verification in settings first. Submit your profile for review.",
    };
  }
  if (p.status === "suspended") {
    return { allowed: false, message: "Account suspended. Contact Ona Care." };
  }
  if (p.status === "rejected") {
    return {
      allowed: false,
      message: p.rejectReason
        ? `Profile rejected: ${p.rejectReason}.`
        : "Profile rejected. Update and resubmit.",
    };
  }
  if (p.status === "draft" || p.status === "pending_review") {
    return {
      allowed: false,
      message:
        p.status === "pending_review"
          ? "Your profile is pending admin review. You cannot Go Live yet."
          : "Complete your verification in settings first. Submit your profile for review.",
    };
  }

  const tier = resolveVisibilityTier(p);
  const rules = rulesForTier(tier);

  if (!rules.canGoLive || tier < 2) {
    return {
      allowed: false,
      message:
        "Tier 1: you can register and set up your profile. Admin must approve Tier 2 before Go Live.",
    };
  }

  // Tier 2: 30-day window after approval
  if (tier === 2 && rules.goLiveWindowDays != null) {
    const ends =
      p.goLiveWindowEndsAt ||
      (p.tier2ApprovedAt
        ? addDaysIso(p.tier2ApprovedAt, rules.goLiveWindowDays)
        : null);
    if (ends) {
      const left = daysRemainingUntil(ends);
      if (left != null && left <= 0) {
        return {
          allowed: false,
          message:
            "Your Tier 2 Go Live window (30 days) has ended. Complete Tier 3 approval to Go Live again.",
        };
      }
    }
  }

  return { allowed: true };
}

/** Warning copy when Tier 2 window is within 5 days */
export function tier2GoLiveWarning(
  p: ArtisanVerificationProfile | null | undefined,
): string | null {
  if (!p) return null;
  const tier = resolveVisibilityTier(p);
  if (tier !== 2) return null;
  const ends =
    p.goLiveWindowEndsAt ||
    (p.tier2ApprovedAt
      ? addDaysIso(p.tier2ApprovedAt, TIER2_GO_LIVE_DAYS)
      : null);
  if (!ends) return null;
  const left = daysRemainingUntil(ends);
  if (left == null || left > TIER2_WARN_DAYS_BEFORE || left <= 0) return null;
  return `Go Live ends in ${left} day${left === 1 ? "" : "s"}. Get Tier 3 approval to keep receiving jobs.`;
}
