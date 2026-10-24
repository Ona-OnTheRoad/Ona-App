"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { playAppSound, unlockAudio } from "@/lib/sound-tone";
import { resolvePostLoginDestination } from "@/lib/auth-return-to";
import type { AccountType } from "@/lib/types";
import {
  COOLDOWN_SEC,
  FAIL_THRESHOLD,
  publicMessage,
  readLastLoginRole,
  writeLastLoginRole,
  type LoginMethod,
} from "./helpers";
import { useCodeCooldown } from "./use-code-cooldown";

/** State, countdown and handlers for the login form: email + password (default), or phone + SMS code. */
export function useSignInForm() {
  const router = useRouter();
  const t = useT();
  const { sendLoginOtp, signInWithLoginOtp, signInWithPassword } = useApp();

  // Customer is preselected; a returning Repair Pro gets their last role back.
  const [preferType, setPreferType] = useState<AccountType | "">("motorist");
  // Email login is the default primary method; phone login is the second option.
  const [method, setMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const cooldown = useCodeCooldown();
  const ambiguousSendRef = useRef(false);

  const showPhone = Boolean(preferType);

  useEffect(() => {
    const last = readLastLoginRole();
    if (last) setPreferType(last);
  }, []);

  function clearFeedback() {
    setError("");
    setInfo("");
  }

  function pickRole(type: AccountType) {
    setPreferType(type);
    ambiguousSendRef.current = false;
    setOtpSent(false);
    setOtp("");
    cooldown.resetCooldown();
    clearFeedback();
  }

  async function onSendCode() {
    clearFeedback();
    if (preferType !== "motorist" && preferType !== "professional") {
      setError(t("auth.pickRole"));
      return;
    }
    if (cooldown.failedAttempts >= FAIL_THRESHOLD && cooldown.inCooldown) {
      setError(`Please wait ${cooldown.cooldownLeft}s before requesting another code.`);
      return;
    }
    const target = phone.trim();
    if (!target) {
      setError("Enter the phone number you used at signup.");
      return;
    }
    setBusy(true);
    try {
      const res = await sendLoginOtp("phone", target, {
        forceResend: ambiguousSendRef.current,
      });
      if (res.error) {
        const waitMatch = res.error.match(/wait\s+(\d+)\s*s/i);
        if (waitMatch) {
          const sec = Number(waitMatch[1]) || COOLDOWN_SEC;
          cooldown.startCooldown(sec);
          setError(`Please wait ${sec}s before requesting another code.`);
          return;
        }
        setError(publicMessage(res.error, "Could not send code."));
        return;
      }
      if (res.maybeSent) {
        ambiguousSendRef.current = true;
        setInfo(
          "Code request may not have gone through. If nothing arrives, tap send again.",
        );
        return;
      }
      ambiguousSendRef.current = false;
      setOtpSent(true);
      const msg = res.message || "Code sent. Enter it below.";
      setInfo(publicMessage(msg, "Code sent. Enter it below."));
    } finally {
      setBusy(false);
    }
  }

  function pickMethod(next: LoginMethod) {
    if (next === method) return;
    setMethod(next);
    ambiguousSendRef.current = false;
    setOtpSent(false);
    setOtp("");
    cooldown.resetCooldown();
    clearFeedback();
  }

  function finishLogin(type: AccountType) {
    writeLastLoginRole(type);
    unlockAudio();
    playAppSound("login_success");
    const target = resolvePostLoginDestination(type);
    window.setTimeout(() => {
      router.replace(target);
    }, 280);
  }

  async function onEmailLogin(type: AccountType) {
    const target = email.trim();
    if (!target || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const err = await signInWithPassword(target, password, type);
      if (err) {
        setError(publicMessage(err, "Email or password is incorrect."));
        unlockAudio();
        playAppSound("error");
        return;
      }
      finishLogin(type);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();
    if (preferType !== "motorist" && preferType !== "professional") {
      setError(t("auth.pickRole"));
      return;
    }
    if (method === "email") {
      await onEmailLogin(preferType);
      return;
    }
    if (!otpSent) {
      await onSendCode();
      return;
    }
    if (!otp.trim()) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      const err = await signInWithLoginOtp(
        "phone",
        phone.trim(),
        otp.trim(),
        preferType,
      );
      if (err) {
        const nextFails = cooldown.registerFailure();
        if (nextFails >= FAIL_THRESHOLD) {
          setError(
            `Please wait ${COOLDOWN_SEC}s before requesting another code.`,
          );
        } else {
          setError(publicMessage(err, "Incorrect code. Try again."));
        }
        unlockAudio();
        playAppSound("error");
        return;
      }
      cooldown.resetCooldown();
      finishLogin(preferType);
    } finally {
      setBusy(false);
    }
  }

  const displayError =
    cooldown.failedAttempts >= FAIL_THRESHOLD && cooldown.inCooldown
      ? `Please wait ${cooldown.cooldownLeft}s before requesting another code.`
      : error;

  function onPhoneChange(value: string) {
    setPhone(value);
    ambiguousSendRef.current = false;
    setOtpSent(false);
    setOtp("");
    cooldown.resetCooldown();
    clearFeedback();
  }

  return {
    preferType,
    method,
    pickMethod,
    email,
    setEmail,
    password,
    setPassword,
    phone,
    otp,
    setOtp,
    otpSent,
    info,
    busy,
    failedAttempts: cooldown.failedAttempts,
    inCooldown: cooldown.inCooldown,
    cooldownLeft: cooldown.cooldownLeft,
    showPhone,
    displayError,
    pickRole,
    onPhoneChange,
    onSendCode,
    onSubmit,
  };
}
