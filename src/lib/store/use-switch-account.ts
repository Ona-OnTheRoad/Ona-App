import { useCallback } from "react";
import { resetNavStack } from "@/lib/navigation";
import { saveProfileToVault } from "@/lib/profiles-vault";
import {
  backendDualRoleFlags,
  backendSetProOnline,
  backendSwitchRole,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { AccountType, UserMode, UserProfile } from "@/lib/types";
import { MODE_KEY } from "./constants";
import { readStoredPrimaryAccount } from "./storage";
import {
  inheritDonorBank,
  mergeSwitchedVerification,
} from "./switch-account-helpers";
import type { SessionStateResult } from "./use-session-state";
import type { ApplySessionResult } from "./use-apply-session";

export function useSwitchAccount(
  session: SessionStateResult,
  applyApi: ApplySessionResult,
) {
  const {
    isAuthenticated,
    accountType,
    primaryAccountType,
    setSwitchingRole,
    userProfile,
    setUserModeState,
    hasMotoristAccount,
    setHasMotoristAccount,
    hasProAccount,
    setHasProAccount,
    setProLiveState,
    setPostSwitchPhoneOtpRequired,
    backendUserId,
    setBackendUserId,
    setProOnboardingSheetRequired,
  } = session;
  const { applySession } = applyApi;

  const switchAccount = useCallback(
    async (
      type: AccountType,
    ): Promise<null | "needs_signup" | "needs_login" | string> => {
      if (!backendUserId || !isAuthenticated) {
        return "needs_login";
      }
      if (!isAppBackendOnline()) {
        return "Server is unavailable. Cannot switch right now.";
      }

      // Same type already active caller navigates; no server call
      if (
        (type === "motorist" && accountType === "motorist") ||
        (type === "professional" && accountType === "professional")
      ) {
        return null;
      }

      // Check both sides BEFORE the full-screen overlay. That overlay used to
      // unmount the menu, so "You don't have a Repair Pro account yet…" never
      // appeared for a one-account tap.
      try {
        const flags = await backendDualRoleFlags(backendUserId);
        setHasMotoristAccount(flags.hasMotorist);
        setHasProAccount(flags.hasPro);
        if (type === "motorist" && !flags.hasMotorist) {
          return "needs_signup";
        }
        if (type === "professional" && !flags.hasPro) {
          return "needs_signup";
        }
      } catch {
        if (type === "motorist" && !hasMotoristAccount) {
          return "needs_signup";
        }
        if (type === "professional" && !hasProAccount) {
          return "needs_signup";
        }
      }

      setSwitchingRole(true);
      try {
        const res = await backendSwitchRole(type);
        if (res.error || !res.profile || !res.userId) {
          if (res.error === "needs_signup") {
            return "needs_signup";
          }
          // Do not fake a client-only switch reload would restore the other role
          return res.error || res.message || "Could not switch account.";
        }

        setBackendUserId(res.userId);
        // Preserve original signup as primary when switching (never use active role)
        const primary: AccountType =
          res.primaryAccountType ||
          res.profile.primaryAccountType ||
          readStoredPrimaryAccount() ||
          primaryAccountType ||
          accountType ||
          "motorist";
        // One bank per login: if this role has no bank, reuse the other role's bank
        // One bank per login: reuse other role's bank if none saved on this role
        const baseSwitched: UserProfile = {
          ...res.profile,
          primaryAccountType: primary,
        };
        const switched = inheritDonorBank(baseSwitched, userProfile, res.userId);
        const withFlags = mergeSwitchedVerification(switched, userProfile);
        saveProfileToVault(withFlags);

        const dualToPro =
          type === "professional" &&
          Boolean(
            res.hasMotorist ||
            hasMotoristAccount ||
            userProfile?.accountType === "motorist",
          );
        const t1Done = Boolean(withFlags.phoneVerified);

        if (dualToPro) {
          // Customer → Pro: lower panel until Care T2; re-OTP if phone not verified
          if (t1Done) {
            applySession(withFlags);
            setPostSwitchPhoneOtpRequired(false);
            setProOnboardingSheetRequired(true);
          } else {
            applySession({ ...withFlags, phoneVerified: false });
            setPostSwitchPhoneOtpRequired(true);
            setProOnboardingSheetRequired(true);
          }
        } else if (type === "motorist") {
          // Pro → Customer: smooth switch if phone verified; re-OTP if not
          if (t1Done) {
            applySession(withFlags);
            setPostSwitchPhoneOtpRequired(false);
            setProOnboardingSheetRequired(false);
          } else {
            applySession({ ...withFlags, phoneVerified: false });
            setPostSwitchPhoneOtpRequired(true);
            setProOnboardingSheetRequired(false);
          }
        } else {
          // Other switches: session re-OTP still required
          applySession({ ...withFlags, phoneVerified: false });
          setPostSwitchPhoneOtpRequired(true);
          setProOnboardingSheetRequired(false);
        }

        if (res.hasMotorist != null) setHasMotoristAccount(res.hasMotorist);
        if (res.hasPro != null) setHasProAccount(res.hasPro);
        // Always Away after a role switch pro must tap Live again
        setProLiveState(false);
        if (backendUserId && isAppBackendOnline()) {
          void backendSetProOnline(backendUserId, false);
        }
        // Fresh nav stack for this role only Back must not hop to the other role
        resetNavStack(type === "professional" ? "/dashboard" : "/");
        return null;
      } finally {
        setSwitchingRole(false);
      }
    },
    [
      applySession,
      isAuthenticated,
      backendUserId,
      accountType,
      primaryAccountType,
      hasMotoristAccount,
      hasProAccount,
      userProfile,
      setBackendUserId,
      setHasMotoristAccount,
      setHasProAccount,
      setPostSwitchPhoneOtpRequired,
      setProLiveState,
      setProOnboardingSheetRequired,
      setSwitchingRole,
    ],
  );

  const setUserMode = useCallback(
    (mode: UserMode) => {
      const target: AccountType =
        mode === "professional" ? "professional" : "motorist";
      void (async () => {
        const result = await switchAccount(target);
        if (result === null) return;
        if (
          (mode === "professional" && accountType === "professional") ||
          (mode === "client" && accountType === "motorist")
        ) {
          setUserModeState(mode);
          try {
            localStorage.setItem(MODE_KEY, mode);
          } catch {
            /* ignore */
          }
        }
      })();
    },
    [switchAccount, accountType, setUserModeState],
  );
  return {
    switchAccount,
    setUserMode,
  };
}

export type SwitchAccountResult = ReturnType<typeof useSwitchAccount>;
