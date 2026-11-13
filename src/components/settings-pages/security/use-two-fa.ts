"use client";

import { useEffect, useMemo, useState } from "react";
import { CUSTOMER_PHONE_OTP } from "@/lib/verification-gate";
import {
  backendProfileVerifyOtp,
  backendSendPhoneOtp,
} from "@/lib/supabase/app-api";
import {
  TWO_FA_KEY,
  TWO_FA_METHOD_KEY,
  TWO_FA_SECRET_KEY,
  demoTotpCode,
  randomSecret,
  storageKey,
  type SetupStep,
  type TwoFaMethod,
} from "./two-fa-utils";

export function useTwoFa(email: string, phone = "") {
  const [twoFaOn, setTwoFaOn] = useState(false);
  const [method, setMethod] = useState<TwoFaMethod>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [secret, setSecret] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [setupErr, setSetupErr] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [smsBusy, setSmsBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    try {
      setTwoFaOn(localStorage.getItem(storageKey(TWO_FA_KEY, email)) === "1");
      const m = localStorage.getItem(storageKey(TWO_FA_METHOD_KEY, email));
      setMethod(m === "sms" || m === "authenticator" ? m : null);
      const sec = localStorage.getItem(storageKey(TWO_FA_SECRET_KEY, email));
      if (sec) setSecret(sec);
    } catch {
      /* */
    }
  }, [email]);

  const expectedTotp = useMemo(
    () => (secret ? demoTotpCode(secret) : ""),
    // recompute roughly every second while authenticator step open
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [secret, setupStep, authCode],
  );

  const persistEnabled = (on: boolean, m: TwoFaMethod) => {
    try {
      localStorage.setItem(storageKey(TWO_FA_KEY, email), on ? "1" : "0");
      if (m) {
        localStorage.setItem(storageKey(TWO_FA_METHOD_KEY, email), m);
      } else {
        localStorage.removeItem(storageKey(TWO_FA_METHOD_KEY, email));
      }
      if (secret) {
        localStorage.setItem(storageKey(TWO_FA_SECRET_KEY, email), secret);
      }
    } catch {
      /* */
    }
  };

  const cancelSetup = () => {
    setSetupStep("idle");
    setSetupErr(null);
    setSmsCode("");
    setAuthCode("");
    setSmsSent(false);
    if (!twoFaOn) {
      // already off
    } else if (!method) {
      setTwoFaOn(false);
      persistEnabled(false, null);
    }
  };

  const disableTwoFa = () => {
    setTwoFaOn(false);
    setMethod(null);
    setSetupStep("idle");
    setSetupErr(null);
    persistEnabled(false, null);
  };

  const onToggle = () => {
    if (twoFaOn && method) {
      // Turning off when fully enrolled
      disableTwoFa();
      return;
    }
    if (setupStep !== "idle") {
      // Cancel mid-setup → prompt confirmation
      setConfirmCancel(true);
      return;
    }
    // Turning ON → open setup immediately
    const sec = secret || randomSecret();
    setSecret(sec);
    try {
      localStorage.setItem(storageKey(TWO_FA_SECRET_KEY, email), sec);
    } catch {
      /* */
    }
    setTwoFaOn(false); // stays off until enrollment completes
    setSetupStep("pick");
    setSetupErr(null);
    setSmsCode("");
    setAuthCode("");
    setSmsSent(false);
  };

  const completeEnrollment = (m: "sms" | "authenticator") => {
    setTwoFaOn(true);
    setMethod(m);
    setSetupStep("idle");
    setSetupErr(null);
    persistEnabled(true, m);
  };

  /** Texts a real code to the account's phone (Africa's Talking via the server). */
  const sendSms = async () => {
    if (smsBusy) return;
    if (!phone.trim()) {
      setSetupErr("Add a phone number to your account first.");
      return;
    }
    setSmsBusy(true);
    setSetupErr(null);
    try {
      const res = await backendSendPhoneOtp(phone.trim());
      if (res.error) {
        setSetupErr(res.error);
        return;
      }
      setSmsSent(true);
    } finally {
      setSmsBusy(false);
    }
  };

  /** The server checks the code: nothing is trusted from the browser. */
  const verifySms = async () => {
    if (smsBusy) return;
    setSetupErr(null);
    const code = smsCode.replace(/\D/g, "");
    if (code.length < 4) {
      setSetupErr("Enter the 6-digit code sent to your phone.");
      return;
    }
    setSmsBusy(true);
    try {
      const res = await backendProfileVerifyOtp({
        channel: "phone",
        target: phone.trim(),
        code,
      });
      if (res.error) {
        setSetupErr(res.error);
        return;
      }
      completeEnrollment("sms");
    } finally {
      setSmsBusy(false);
    }
  };

  const verifyAuth = () => {
    setSetupErr(null);
    const code = authCode.replace(/\D/g, "");
    if (code.length !== 6) {
      setSetupErr("Enter the 6-digit code from your authenticator app");
      return;
    }
    // Accept current window code or demo OTP for reliability in demo builds
    if (code !== expectedTotp && code !== CUSTOMER_PHONE_OTP) {
      setSetupErr("Code does not match. Try the current code from your app");
      return;
    }
    completeEnrollment("authenticator");
  };

  return {
    twoFaOn,
    setTwoFaOn,
    method,
    setupStep,
    setSetupStep,
    secret,
    smsCode,
    setSmsCode,
    authCode,
    setAuthCode,
    setupErr,
    setSetupErr,
    smsSent,
    setSmsSent,
    smsBusy,
    sendSms,
    confirmCancel,
    setConfirmCancel,
    persistEnabled,
    cancelSetup,
    onToggle,
    verifySms,
    verifyAuth,
  };
}
