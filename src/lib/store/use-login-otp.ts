import { useCallback } from "react";
import { saveProfileToVault } from "@/lib/profiles-vault";
import {
  backendDualRoleFlags,
  backendSendOtp,
  backendSignInWithOtp,
  backendSignOut,
  backendSwitchRole,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { AccountType, UserProfile } from "@/lib/types";
import { writeStoredPrimaryAccount } from "./storage";
import type { SessionStateResult } from "./use-session-state";
import type { ApplySessionResult } from "./use-apply-session";

export function useLoginOtp(
  session: SessionStateResult,
  applyApi: ApplySessionResult,
) {
  const {
    setPrimaryAccountType,
    setHasMotoristAccount,
    setHasProAccount,
    setBackendUserId,
    setServerSessionReady,
  } = session;
  const { applySession } = applyApi;

  /** Send OTP to phone or email. Returns error string, or null on success (message in second channel via throw pattern we return null and caller uses info). */
  const sendLoginOtp = useCallback(
    async (
      channel: "phone" | "email",
      target: string,
      opts?: { forceResend?: boolean },
    ): Promise<{
      error: string | null;
      message?: string;
      maybeSent?: boolean;
    }> => {
      if (!isAppBackendOnline()) {
        return { error: "Server is unavailable." };
      }
      const res = await backendSendOtp(
        { channel, target },
        { forceResend: opts?.forceResend },
      );
      return {
        error: res.error,
        message: res.message,
        maybeSent: res.maybeSent,
      };
    },
    [],
  );

  const signInWithLoginOtp = useCallback(
    async (
      channel: "phone" | "email",
      target: string,
      code: string,
      preferType?: AccountType,
    ): Promise<string | null> => {
      if (!isAppBackendOnline()) {
        return "Server is unavailable.";
      }
      if (preferType !== "motorist" && preferType !== "professional") {
        return "Pick Customer or Repair Pro.";
      }
      const res = await backendSignInWithOtp({
        channel,
        target,
        code,
        preferType,
      });
      if (res.error || !res.profile || !res.userId) {
        return res.error || "Invalid code.";
      }
      const flags = await backendDualRoleFlags(res.userId).catch(() => ({
        hasMotorist: res.profile!.accountType === "motorist",
        hasPro: res.profile!.accountType === "professional",
        primaryAccountType: res.profile!.primaryAccountType,
      }));
      const hasMotorist =
        flags.hasMotorist || res.profile.accountType === "motorist";
      const hasPro = flags.hasPro || res.profile.accountType === "professional";

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
          flags.primaryAccountType ||
          res.profile.accountType,
      };
      let sessionUserId = res.userId;

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
      if (flags.primaryAccountType) {
        setPrimaryAccountType(flags.primaryAccountType);
        writeStoredPrimaryAccount(flags.primaryAccountType);
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

  const signInWithPhoneOtp = useCallback(
    async (
      phone: string,
      code: string,
      preferType?: AccountType,
    ): Promise<string | null> => {
      return signInWithLoginOtp("phone", phone, code, preferType);
    },
    [signInWithLoginOtp],
  );
  return {
    sendLoginOtp,
    signInWithLoginOtp,
    signInWithPhoneOtp,
  };
}

export type LoginOtpResult = ReturnType<typeof useLoginOtp>;
