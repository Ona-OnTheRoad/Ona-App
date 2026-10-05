import { useCallback } from "react";
import { resetNavStack } from "@/lib/navigation";
import { getVaultProfile, saveProfileToVault } from "@/lib/profiles-vault";
import {
  backendDualRoleFlags,
  backendSetProOnline,
  backendSwitchRole,
  backendUpdateProfile,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { AccountType, UserMode, UserProfile } from "@/lib/types";
import { MODE_KEY } from "./constants";
import { readStoredPrimaryAccount } from "./storage";
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
        // so Repair Pro never asks for a "fresh" bank when Customer already saved one.
        let switched: UserProfile = {
          ...res.profile,
          primaryAccountType: primary,
        };
        const bankComplete = (p: UserProfile | null | undefined) =>
          Boolean(
            p &&
            (p.bankCode || "").trim() &&
            (p.bankAccountName || "").trim() &&
            (p.bankAccountNumber || "").replace(/\D/g, "").length === 10,
          );
        if (!bankComplete(switched)) {
          const vaultMot = getVaultProfile("motorist");
          const vaultPro = getVaultProfile("professional");
          const donor =
            (bankComplete(vaultMot) && vaultMot) ||
            (bankComplete(vaultPro) && vaultPro) ||
            (bankComplete(userProfile) && userProfile) ||
            null;
          if (donor) {
            switched = {
              ...switched,
              bankCode: donor.bankCode,
              bankName: donor.bankName,
              bankAccountName: donor.bankAccountName,
              bankAccountNumber: donor.bankAccountNumber,
            };
            // Persist to the active role side-table + identity bank sync
            if (isAppBackendOnline() && res.userId) {
              void (async () => {
                try {
                  const { ensureAppSession } =
                    await import("@/lib/supabase/session");
                  const s = await ensureAppSession();
                  if (!s?.accessToken) return;
                  await backendUpdateProfile(s.accessToken, {
                    bankCode: donor.bankCode,
                    bankName: donor.bankName,
                    bankAccountName: donor.bankAccountName,
                    bankAccountNumber: donor.bankAccountNumber,
                  });
                } catch {
                  /* non-fatal UI already has bank */
                }
              })();
            }
          }
        }
        // Carry verification flags from server + preserve Customer T2 if API omits
        const prev = userProfile;
        const withFlags: UserProfile = {
          ...switched,
          phoneVerified: Boolean(switched.phoneVerified || prev?.phoneVerified),
          identityReviewStatus:
            switched.identityReviewStatus || prev?.identityReviewStatus,
          govIdVerified: Boolean(switched.govIdVerified || prev?.govIdVerified),
          identityVerifiedAt:
            switched.identityVerifiedAt || prev?.identityVerifiedAt,
          identitySubmittedAt:
            switched.identitySubmittedAt || prev?.identitySubmittedAt,
          govIdKind: switched.govIdKind || prev?.govIdKind,
          govIdFrontUrl: switched.govIdFrontUrl || prev?.govIdFrontUrl,
          ninVerified: Boolean(switched.ninVerified || prev?.ninVerified),
          bvnVerified: Boolean(switched.bvnVerified || prev?.bvnVerified),
        };
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
