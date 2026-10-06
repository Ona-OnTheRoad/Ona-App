import { useCallback } from "react";
import { saveProfileToVault } from "@/lib/profiles-vault";
import {
  backendDualRoleFlags,
  backendSendPhoneOtp,
  backendSignIn,
  backendSignOut,
  backendSwitchRole,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { AccountType, UserProfile } from "@/lib/types";
import { writeStoredPrimaryAccount } from "./storage";
import type { SessionStateResult } from "./use-session-state";
import type { ApplySessionResult } from "./use-apply-session";

export function useSignIn(
  session: SessionStateResult,
  applyApi: ApplySessionResult,
) {
  const {
    setPrimaryAccountType,
    userProfile,
    setHasMotoristAccount,
    setHasProAccount,
    setPostSwitchPhoneOtpRequired,
    setBackendUserId,
    setServerSessionReady,
  } = session;
  const { applySession } = applyApi;

  const signInWithPassword = useCallback(
    async (
      email: string,
      password: string,
      preferType?: AccountType,
    ): Promise<string | null> => {
      if (!isAppBackendOnline()) {
        return "Server is unavailable. Log in requires a live Ona account.";
      }
      if (preferType !== "motorist" && preferType !== "professional") {
        return "Pick Customer or Repair Pro.";
      }
      const res = await backendSignIn(email.trim().toLowerCase(), password);
      if (res.error || !res.profile || !res.userId) {
        return res.error || "Email or password is incorrect.";
      }

      // Prefer flags from login response (one round-trip); fall back if missing
      let hasMotorist =
        res.hasMotorist ?? res.profile.accountType === "motorist";
      let hasPro = res.hasPro ?? res.profile.accountType === "professional";
      let primaryFromFlags =
        res.primaryAccountType || res.profile.primaryAccountType;
      if (res.hasMotorist == null || res.hasPro == null) {
        const flags = await backendDualRoleFlags(res.userId).catch(() => ({
          hasMotorist: res.profile!.accountType === "motorist",
          hasPro: res.profile!.accountType === "professional",
          primaryAccountType: res.profile!.primaryAccountType,
        }));
        hasMotorist =
          flags.hasMotorist || res.profile.accountType === "motorist";
        hasPro = flags.hasPro || res.profile.accountType === "professional";
        primaryFromFlags = flags.primaryAccountType || primaryFromFlags;
      }

      if (preferType === "motorist" && !hasMotorist) {
        await backendSignOut().catch(() => undefined);
        return "No Customer account for this login. Choose Repair Pro, or sign up as Customer.";
      }
      if (preferType === "professional" && !hasPro) {
        await backendSignOut().catch(() => undefined);
        return "No Repair Pro account for this login. Choose Customer, or sign up as Repair Pro.";
      }

      let sessionProfile: UserProfile = {
        ...res.profile,
        primaryAccountType:
          res.profile.primaryAccountType ||
          primaryFromFlags ||
          res.profile.accountType,
      };
      let sessionUserId = res.userId;

      // Force session into the role they picked (dual-role safe)
      if (sessionProfile.accountType !== preferType) {
        const switched = await backendSwitchRole(preferType).catch(() => null);
        if (switched?.profile && switched.userId) {
          sessionProfile = {
            ...switched.profile,
            primaryAccountType:
              switched.primaryAccountType ||
              switched.profile.primaryAccountType ||
              sessionProfile.primaryAccountType,
          };
          sessionUserId = switched.userId;
        } else {
          sessionProfile = { ...sessionProfile, accountType: preferType };
        }
      }

      setBackendUserId(sessionUserId);
      saveProfileToVault(sessionProfile);
      applySession(sessionProfile);
      setServerSessionReady(true);
      setHasMotoristAccount(hasMotorist);
      setHasProAccount(hasPro);
      if (primaryFromFlags) {
        setPrimaryAccountType(primaryFromFlags);
        writeStoredPrimaryAccount(primaryFromFlags);
      }
      return null;
    },
    [
      applySession,
      setBackendUserId,
      setHasMotoristAccount,
      setHasProAccount,
      setPrimaryAccountType,
      setServerSessionReady,
    ],
  );

  const sendPhoneOtp = useCallback(
    async (phone: string): Promise<string | null> => {
      if (!isAppBackendOnline()) {
        return "Server is unavailable.";
      }
      const res = await backendSendPhoneOtp(phone);
      return res.error;
    },
    [],
  );

  const sendPostSwitchPhoneOtp = useCallback(async (): Promise<
    string | null
  > => {
    const phone = (userProfile?.phone || "").trim();
    if (!phone)
      return "No phone on this account. Add a phone in Settings first.";
    if (!isAppBackendOnline()) return "Server is unavailable.";
    const res = await backendSendPhoneOtp(phone);
    return res.error;
  }, [userProfile?.phone]);

  const completePostSwitchPhoneOtp = useCallback(
    async (code: string): Promise<string | null> => {
      const dig = code.replace(/\D/g, "");
      if (dig.length < 4) return "Enter the 6-digit code.";
      const phone = (userProfile?.phone || "").trim();
      if (!phone) return "No phone on this account.";
      // Demo code 336699 always works for dual-role switch (client fast-path)
      // even if server is unreachable or env is masked. Server fix in demo-otp.ts
      // ensures prod also accepts it, but keep client fallback for resilience.
      const { isDemoOtp, isDemoOtpAllowed } =
        await import("@/lib/auth/demo-otp");
      const isDemo = isDemoOtp(dig);
      if (!isAppBackendOnline()) {
        if (isDemo && isDemoOtpAllowed()) {
          if (userProfile) {
            const next = { ...userProfile, phoneVerified: true };
            saveProfileToVault(next);
            applySession(next);
          }
          setPostSwitchPhoneOtpRequired(false);
          return null;
        }
        return "Server is unavailable.";
      }
      // Try server verification first; if it rejects demo code due to transient
      // config, still succeed locally so 336699 never blocks dual-role users.
      try {
        const r = await fetch("/api/auth/otp/profile-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "phone",
            target: phone,
            code: dig,
          }),
        });
        const json = (await r.json().catch(() => null)) as {
          ok?: boolean;
          error?: { message?: string };
        } | null;
        if (json?.ok) {
          // server verified (demo or real)
        } else if (isDemo && isDemoOtpAllowed()) {
          // server rejected demo (e.g. masked env) fall through to local success
        } else {
          return json?.error?.message || "Incorrect code. Try again.";
        }
      } catch {
        if (isDemo && isDemoOtpAllowed()) {
          // network failure fall through to local success for demo code
        } else {
          return "Could not verify code. Check network and try again.";
        }
      }
      if (userProfile) {
        const next = { ...userProfile, phoneVerified: true };
        saveProfileToVault(next);
        applySession(next);
      }
      setPostSwitchPhoneOtpRequired(false);
      return null;
    },
    [userProfile, applySession, setPostSwitchPhoneOtpRequired],
  );
  return {
    signInWithPassword,
    sendPhoneOtp,
    sendPostSwitchPhoneOtp,
    completePostSwitchPhoneOtp,
  };
}

export type SignInResult = ReturnType<typeof useSignIn>;
