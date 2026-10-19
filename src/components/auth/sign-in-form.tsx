"use client";

import { useState } from "react";
import { OnaScreen } from "@/components/ui/ona-screen";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { dialForIso, DEFAULT_PHONE_ISO } from "@/lib/phone-codes";
import { useT } from "@/lib/i18n";
import { CodeStep } from "./sign-in-form/code-step";
import { FAIL_THRESHOLD } from "./sign-in-form/helpers";
import { PhoneStep } from "./sign-in-form/phone-step";
import {
  composeLoginPhone,
  splitPastedPhone,
} from "./sign-in-form/phone-input";
import { useSignInForm } from "./sign-in-form/use-sign-in-form";

/**
 * Phone-only login (email is signup-only).
 * One page, two steps: Role + phone, then the SMS code.
 */
export function SignInForm() {
  const t = useT();
  const { exiting, go } = useAuthNavigate();
  const form = useSignInForm();
  const [iso, setIso] = useState(DEFAULT_PHONE_ISO);
  const [national, setNational] = useState("");

  const failCooldown = form.failedAttempts >= FAIL_THRESHOLD && form.inCooldown;
  // Ticking text must not be re-announced every second: use a stable message.
  const error = failCooldown
    ? "Too many incorrect codes. Wait for the timer, then request a new code."
    : form.displayError;

  function onNationalChange(value: string) {
    const pasted = splitPastedPhone(value);
    if (pasted) {
      setIso(pasted.iso);
      setNational(pasted.national);
      form.onPhoneChange(
        composeLoginPhone(dialForIso(pasted.iso), pasted.national),
      );
      return;
    }
    setNational(value);
    form.onPhoneChange(composeLoginPhone(dialForIso(iso), value));
  }

  function onIsoChange(next: string) {
    setIso(next);
    form.onPhoneChange(composeLoginPhone(dialForIso(next), national));
  }

  function leave() {
    try {
      sessionStorage.removeItem("ona-entry-done");
    } catch {
      /* ignore */
    }
    go("/login");
  }

  const codeStep = form.otpSent;

  return (
    <OnaScreen
      wordmark={!codeStep}
      exiting={exiting}
      onBack={codeStep ? () => form.onPhoneChange(form.phone) : leave}
      backLabel={t("common.back")}
      footer={
        codeStep ? null : (
          <button
            type="button"
            onClick={() => go("/login/role")}
            className="mx-auto flex min-h-[44px] items-center border-0 bg-transparent text-[14px] font-semibold text-ona-brand-ink underline underline-offset-2"
          >
            {t("auth.newHere")}
          </button>
        )
      }
    >
      <form onSubmit={form.onSubmit}>
        {codeStep ? (
          <CodeStep
            phone={form.phone}
            otp={form.otp}
            setOtp={form.setOtp}
            info={form.info}
            error={error}
            busy={form.busy}
            cooldownActive={failCooldown}
            cooldownLeft={form.cooldownLeft}
            onResend={() => void form.onSendCode()}
          />
        ) : (
          <PhoneStep
            preferType={form.preferType}
            pickRole={form.pickRole}
            iso={iso}
            national={national}
            onIsoChange={onIsoChange}
            onNationalChange={onNationalChange}
            showPhone={form.showPhone}
            info={form.info}
            error={error}
            busy={form.busy}
          />
        )}
      </form>
    </OnaScreen>
  );
}
