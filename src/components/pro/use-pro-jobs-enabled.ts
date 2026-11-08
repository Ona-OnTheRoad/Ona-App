"use client";

import { useEffect, useMemo } from "react";
import { getArtisanProfile } from "@/lib/artisan/local-store";
import { isProJobsEligible } from "@/lib/pro-jobs-gate";
import { backendLoadUserProfile } from "@/lib/supabase/app-api";
import { useApp } from "@/lib/store";

/** Re-check cadence for a pro who is still waiting on Tier 2 approval. */
const APPROVAL_RECHECK_MS = 2 * 60 * 1000;

/**
 * True once the signed-in professional is allowed to fetch and poll jobs
 * (Tier 2 care-approved, not suspended or rejected). Customers, guests and
 * unverified pros never hit the jobs endpoints.
 */
export function useProJobsEligible(): boolean {
  const { accountType, userProfile, backendUserId } = useApp();
  return useMemo(() => {
    let artisan = null;
    try {
      artisan = backendUserId ? getArtisanProfile(backendUserId) : null;
    } catch {
      artisan = null;
    }
    return isProJobsEligible(accountType, userProfile, artisan);
  }, [accountType, userProfile, backendUserId]);
}

/**
 * While a pro is waiting for approval there is no job polling, so approval must
 * be noticed another way: one forced profile read every couple of minutes
 * (visible tab only, and when the tab regains focus). Mount once, app-wide.
 */
export function useProApprovalWatch(): void {
  const {
    accountType,
    isAuthenticated,
    authReady,
    backendUserId,
    updateUserProfile,
  } = useApp();
  const eligible = useProJobsEligible();

  useEffect(() => {
    if (
      eligible ||
      !authReady ||
      !isAuthenticated ||
      accountType !== "professional" ||
      !backendUserId
    ) {
      return;
    }
    let cancelled = false;
    const check = async () => {
      if (document.hidden) return;
      try {
        const p = await backendLoadUserProfile(backendUserId, { force: true });
        if (!cancelled && p?.proJobsEligible) {
          updateUserProfile({ proJobsEligible: true });
        }
      } catch {
        /* offline: try again next time */
      }
    };
    const timer = window.setInterval(() => void check(), APPROVAL_RECHECK_MS);
    const onVisible = () => {
      if (!document.hidden) void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [
    eligible,
    authReady,
    isAuthenticated,
    accountType,
    backendUserId,
    updateUserProfile,
  ]);
}
