"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { playAppSound, unlockAudio } from "@/lib/sound-tone";
import type { AccountType } from "@/lib/types";
import { COOLDOWN_SEC, FAIL_THRESHOLD, publicMessage } from "./helpers";

/** State, countdown and handlers for the phone + OTP login form. */
export function useSignInForm() {
  const router = useRouter();
  const t = useT();
  const { sendLoginOtp, signInWithLoginOtp } = useApp();

  const [preferType, setPreferType] = useState<AccountType | "">("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const ambiguousSendRef = useRef(false);

  const showPhone = Boolean(preferType);
  const inCooldown = cooldownLeft > 0;

  // Live countdown tick
  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left <= 0) setCooldownUntil(0);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  function clearFeedback() {
    setError("");
    setInfo("");
  }

  function startCooldown(sec = COOLDOWN_SEC) {
    setCooldownUntil(Date.now() + sec * 1000);
    setCooldownLeft(sec);
  }

  function pickRole(type: AccountType) {
    setPreferType(type);
    ambiguousSendRef.current = false;
    setOtpSent(false);
    setOtp("");
    setFailedAttempts(0);
    setCooldownUntil(0);
    clearFeedback();
  }

  async function onSendCode() {
    clearFeedback();
    if (preferType !== "motorist" && preferType !== "professional") {
      setError(t("auth.pickRole"));
      return;
    }
    // Cooldown message only after 4 failed attempts live countdown
    if (failedAttempts >= FAIL_THRESHOLD && inCooldown) {
      setError(`Please wait ${cooldownLeft}s before requesting another code.`);
      return;
    }
    const target = phone.trim();
    if (!target) {
      setError("Enter the phone number you used at signup.");
      return;
    }
    setBusy(true);
    try {
      // After a maybe-sent result the next tap is a deliberate resend, so the
      // idempotency key is cleared and a fresh code genuinely goes out.
      const res = await sendLoginOtp("phone", target, {
        forceResend: ambiguousSendRef.current,
      });
      if (res.error) {
        // Parse server wait if present (after 4 fails)
        const waitMatch = res.error.match(/wait\s+(\d+)\s*s/i);
        if (waitMatch) {
          const sec = Number(waitMatch[1]) || COOLDOWN_SEC;
          startCooldown(sec);
          setError(`Please wait ${sec}s before requesting another code.`);
          return;
        }
        setError(publicMessage(res.error, "Could not send code."));
        return;
      }
      if (res.maybeSent) {
        // Outcome unproven (response lost) stay neutral, never block.
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();
    if (preferType !== "motorist" && preferType !== "professional") {
      setError(t("auth.pickRole"));
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
        const nextFails = failedAttempts + 1;
        setFailedAttempts(nextFails);
        // After 4 failed attempts → start live resend cooldown
        if (nextFails >= FAIL_THRESHOLD) {
          startCooldown(COOLDOWN_SEC);
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
      setFailedAttempts(0);
      setCooldownUntil(0);
      unlockAudio();
      playAppSound("login_success");
      window.setTimeout(() => {
        router.replace(preferType === "professional" ? "/dashboard" : "/");
      }, 280);
    } finally {
      setBusy(false);
    }
  }

  // Keep error line live while counting down
  const displayError =
    failedAttempts >= FAIL_THRESHOLD && inCooldown
      ? `Please wait ${cooldownLeft}s before requesting another code.`
      : error;

  function onPhoneChange(value: string) {
    setPhone(value);
    ambiguousSendRef.current = false;
    setOtpSent(false);
    setOtp("");
    setFailedAttempts(0);
    setCooldownUntil(0);
    clearFeedback();
  }

  return {
    preferType,
    phone,
    otp,
    setOtp,
    otpSent,
    info,
    busy,
    failedAttempts,
    inCooldown,
    cooldownLeft,
    showPhone,
    displayError,
    pickRole,
    onPhoneChange,
    onSendCode,
    onSubmit,
  };
}
