import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  ensureArtisanDraft,
  getArtisanProfile,
  saveArtisanProfile,
} from "@/lib/artisan/local-store";
import {
  CARE_STATUS_POLL_MS,
  syncArtisanCareStatus,
} from "@/lib/artisan/sync-care-status";
import type {
  ArtisanOnboardingStep,
  ArtisanVerificationProfile,
} from "@/lib/artisan/types";
import {
  ARTISAN_STEP_KEY,
  countryName,
  resolveSignupCountryIso,
} from "@/lib/geo/service-area";
import type { ProService, UserProfile } from "@/lib/types";
import { STEPS } from "./constants";

type Params = {
  userId: string;
  mode: "full" | "settings";
  pathname: string | null;
  displayName: string;
  userProfile: UserProfile | null;
  lockedPrimaryTrade: ProService | null;
  setProfile: Dispatch<SetStateAction<ArtisanVerificationProfile | null>>;
  setStep: Dispatch<SetStateAction<ArtisanOnboardingStep>>;
  setErr: Dispatch<SetStateAction<string | null>>;
  setMsg: Dispatch<SetStateAction<string | null>>;
};

/** Hydrate the local draft, reconcile with the server, restore the saved step */
export function useArtisanHydrate({
  userId,
  mode,
  pathname,
  displayName,
  userProfile,
  lockedPrimaryTrade,
  setProfile,
  setStep,
  setErr,
  setMsg,
}: Params) {
  // Hydrate draft + reconcile with server (care reset must unlock re-verify)
  useEffect(() => {
    let cancelled = false;
    const iso = resolveSignupCountryIso(userProfile?.identityCountryIso);
    const primary =
      lockedPrimaryTrade || userProfile?.services?.[0] || undefined;
    let next = ensureArtisanDraft({
      userId,
      fullName: userProfile?.fullName || displayName || "Artisan",
      phone: userProfile?.phone || "",
      email: userProfile?.email,
      service: primary,
      countryCode: iso,
      countryName: countryName(iso),
    });

    // Always re-read latest (state/city/LGA pickers write to the same store)
    const fresh = getArtisanProfile(userId);
    if (fresh) next = fresh;

    let dirty = false;
    // Unify with server/app identity phone flag (same as Customer Tier 1)
    if (userProfile?.phoneVerified && !next.tiers.tier1_phone) {
      next = {
        ...next,
        tiers: { ...next.tiers, tier1_phone: true },
      };
      dirty = true;
    }
    // Force primary trade from signup when known (lock)
    if (primary && next.trade.service !== primary) {
      next = {
        ...next,
        trade: { service: primary, specialty: next.trade.specialty },
      };
      dirty = true;
    }
    const spec = userProfile?.skillAnswers?.specialty;
    if (typeof spec === "string" && spec.trim() && !next.trade.specialty) {
      next = {
        ...next,
        trade: { ...next.trade, specialty: spec.trim() },
      };
      dirty = true;
    }
    if (next.serviceArea.countryCode !== iso || !next.serviceArea.countryName) {
      next = {
        ...next,
        serviceArea: {
          ...next.serviceArea,
          countryCode: iso,
          countryName: countryName(iso),
        },
      };
      dirty = true;
    }
    if (dirty) saveArtisanProfile(next);
    setProfile(next);

    const syncFromServer = async () => {
      const result = await syncArtisanCareStatus(userId, {
        local: getArtisanProfile(userId) || next,
      });
      if (cancelled) return;
      if (!result.ok) {
        if (result.authFailed) {
          setErr("Sign in again to refresh ID status.");
        }
        return;
      }
      if (result.changed && result.profile) {
        setProfile(result.profile);
        if (result.userMessage) {
          setMsg(result.userMessage);
          if (result.t2Approved) setErr(null);
        }
      }
    };

    void syncFromServer();
    const pollId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void syncFromServer();
    }, CARE_STATUS_POLL_MS);

    if (mode === "full") {
      try {
        const saved = sessionStorage.getItem(ARTISAN_STEP_KEY);
        if (saved && STEPS.some((s) => s.id === saved)) {
          setStep(saved as ArtisanOnboardingStep);
          sessionStorage.removeItem(ARTISAN_STEP_KEY);
        }
      } catch {
        /* */
      }
    }
    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
    // Only re-run when identity/user changes not every profile field tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, lockedPrimaryTrade, mode]);

  // Back from state/city/LGA routes re-read vault + restore Profile step
  useEffect(() => {
    if (pathname !== "/artisan/onboarding") return;
    const fresh = getArtisanProfile(userId);
    if (fresh) setProfile(fresh);
    try {
      const saved = sessionStorage.getItem(ARTISAN_STEP_KEY);
      if (saved && STEPS.some((s) => s.id === saved)) {
        setStep(saved as ArtisanOnboardingStep);
        sessionStorage.removeItem(ARTISAN_STEP_KEY);
      }
    } catch {
      /* */
    }
  }, [pathname, userId, setProfile, setStep]);
}
