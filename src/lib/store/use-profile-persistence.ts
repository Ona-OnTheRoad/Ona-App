import { useCallback } from "react";
import { registerIdentity } from "@/lib/account-registry";
import { readProfilesVault, saveProfileToVault } from "@/lib/profiles-vault";
import { isAppBackendOnline } from "@/lib/supabase/app-api";
import { backendSaveIdentityVerification } from "@/lib/supabase/identity-submit";
import type { UserProfile } from "@/lib/types";
import { PROFILE_KEY } from "./constants";
import type { SessionStateResult } from "./use-session-state";

export function useProfilePersistence(session: SessionStateResult) {
  const {
    userProfile,
    setUserProfile,
    setHasMotoristAccount,
    setHasProAccount,
    backendUserId,
  } = session;

  const persistProfile = useCallback(
    (profile: UserProfile) => {
      setUserProfile(profile);
      saveProfileToVault(profile);
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      } catch {
        /* ignore */
      }
      // OR with existing flags saving motorist must not clear hasProAccount
      setHasMotoristAccount((prev) =>
        Boolean(
          prev ||
          profile.accountType === "motorist" ||
          readProfilesVault().motorist,
        ),
      );
      setHasProAccount((prev) =>
        Boolean(
          prev ||
          profile.accountType === "professional" ||
          readProfilesVault().professional,
        ),
      );
    },
    [setHasMotoristAccount, setHasProAccount, setUserProfile],
  );

  const verifyCustomerPhoneOtp = useCallback(
    async (code: string): Promise<string | null> => {
      if (!userProfile) return "Sign in first.";
      const dig = code.replace(/\D/g, "");
      if (dig.length < 4) return "Enter the 6-digit code.";

      // Always verify via server (demo 336699 accepted only when server allows it).
      // Never self-assert phoneVerified from the client.
      if (!isAppBackendOnline() || !userProfile.phone) {
        return "Could not verify code. Check network and try again.";
      }
      try {
        const r = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "phone",
            target: userProfile.phone,
            code: dig,
            preferType: userProfile.accountType,
          }),
        });
        const json = (await r.json().catch(() => null)) as {
          ok?: boolean;
          error?: { message?: string };
        } | null;
        if (!json?.ok) {
          return json?.error?.message || "Invalid code. Try again.";
        }
      } catch {
        return "Could not verify code. Check network and try again.";
      }

      const next = { ...userProfile, phoneVerified: true };
      persistProfile(next);
      setUserProfile(next);
      return null;
    },
    [userProfile, persistProfile, setUserProfile],
  );

  const completeIdentityVerification = useCallback(
    async (input: {
      nin?: string;
      bvn?: string;
      primaryId?: string;
      bankId?: string;
      countryIso?: string;
      govIdKind?: string;
      govIdFrontUrl?: string;
      govIdBackUrl?: string;
      govIdVerified?: boolean;
      bankIdVerified?: boolean;
      mode?: "submit" | "approve";
    }): Promise<string | null> => {
      if (!userProfile) return "Sign in to verify your identity.";

      const primary = (input.primaryId || input.nin || "").trim();
      const bank = (input.bankId || input.bvn || "").trim();
      const iso = (
        input.countryIso ||
        userProfile.identityCountryIso ||
        "NG"
      ).toUpperCase();
      const mode = input.mode || "submit";

      if (!primary) {
        return "Enter your ID number to continue.";
      }
      if (
        !input.govIdFrontUrl &&
        !userProfile.govIdFrontUrl &&
        mode === "submit"
      ) {
        return "Upload a clear photo of your ID.";
      }

      // Submit for review do NOT mark verified until admin/care approves
      if (mode === "submit") {
        if (isAppBackendOnline() && backendUserId) {
          let accessToken: string | null = null;
          try {
            const { getAppSupabase } =
              await import("@/lib/supabase/app-client");
            const sb = getAppSupabase();
            if (sb) {
              const { data } = await sb.auth.getSession();
              accessToken = data.session?.access_token ?? null;
            }
          } catch {
            /* */
          }
          const err = await backendSaveIdentityVerification({
            accountType: userProfile.accountType,
            primaryId: primary,
            bankId: bank || undefined,
            countryIso: iso,
            govIdKind: input.govIdKind || userProfile.govIdKind,
            govIdFrontUrl: input.govIdFrontUrl || userProfile.govIdFrontUrl,
            govIdBackUrl: input.govIdBackUrl || userProfile.govIdBackUrl,
            accessToken,
          });
          if (err) return err;
        } else if (isAppBackendOnline() && !backendUserId) {
          return "Session not linked to server. Sign in again, then verify.";
        }

        const saved: UserProfile = {
          ...userProfile,
          idNumber: primary,
          bvn: bank || userProfile.bvn,
          identityCountryIso: iso,
          govIdKind: input.govIdKind || userProfile.govIdKind,
          govIdFrontUrl: input.govIdFrontUrl || userProfile.govIdFrontUrl,
          govIdBackUrl: input.govIdBackUrl || userProfile.govIdBackUrl,
          govIdVerified: false,
          ninVerified: false,
          bvnVerified: false,
          identityReviewStatus: "submitted",
          identitySubmittedAt: new Date().toISOString(),
          identityVerifiedAt: undefined,
        };
        persistProfile(saved);
        return null;
      }

      // Admin/care approve path (local session mirror)
      const saved: UserProfile = {
        ...userProfile,
        idNumber: primary || userProfile.idNumber,
        bvn: bank || userProfile.bvn,
        identityCountryIso: iso,
        govIdKind: input.govIdKind || userProfile.govIdKind,
        govIdFrontUrl: input.govIdFrontUrl || userProfile.govIdFrontUrl,
        govIdBackUrl: input.govIdBackUrl || userProfile.govIdBackUrl,
        govIdVerified: true,
        ninVerified: true,
        bvnVerified: Boolean(bank) || userProfile.bvnVerified,
        identityReviewStatus: "approved",
        identityVerifiedAt: new Date().toISOString(),
      };
      persistProfile(saved);

      if (saved.identityId) {
        registerIdentity({
          id: saved.identityId,
          accountType: saved.accountType,
          phone: saved.phone,
          email: saved.email,
          nin: primary,
          bvn: bank || undefined,
          fullName: saved.fullName,
          createdAt: saved.registeredAt || new Date().toISOString(),
        });
      }
      return null;
    },
    [userProfile, persistProfile, backendUserId],
  );
  return {
    persistProfile,
    verifyCustomerPhoneOtp,
    completeIdentityVerification,
  };
}

export type ProfilePersistenceResult = ReturnType<typeof useProfilePersistence>;
