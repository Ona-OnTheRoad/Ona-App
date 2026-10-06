import {
  useEffect,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { isProSwitchMandatoryOnboardingDone } from "@/lib/pro-switch-onboarding";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import type { UserProfile } from "@/lib/types";

/** Notify the host once the mandatory T1 + T2 tiers are satisfied */
export function useMandatoryComplete(
  onMandatoryComplete: (() => void) | undefined,
  userProfile: UserProfile | null,
  profile: ArtisanVerificationProfile | null,
) {
  useEffect(() => {
    if (!onMandatoryComplete || !profile) return;
    if (isProSwitchMandatoryOnboardingDone(userProfile, profile)) {
      onMandatoryComplete();
    }
  }, [
    onMandatoryComplete,
    userProfile,
    profile,
    profile?.tiers?.tier1_phone,
    profile?.tiers?.tier2_govId,
    profile?.govIdReviewStatus,
  ]);
}

/** Close ID type menu on outside click */
export function useIdTypeMenuDismiss(
  idTypeMenuOpen: boolean,
  idTypeWrapRef: RefObject<HTMLDivElement | null>,
  setIdTypeMenuOpen: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (!idTypeMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!idTypeWrapRef.current?.contains(e.target as Node)) {
        setIdTypeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [idTypeMenuOpen, idTypeWrapRef, setIdTypeMenuOpen]);
}
