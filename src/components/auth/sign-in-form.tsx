"use client";

import { useState } from "react";
import { OnaScreen } from "@/components/ui/ona-screen";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { dialForIso, DEFAULT_PHONE_ISO } from "@/lib/phone-codes";
import { useT } from "@/lib/i18n";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { CodeStep } from "./sign-in-form/code-step";
import { FAIL_THRESHOLD } from "./sign-in-form/helpers";
import { ForgotStep } from "./sign-in-form/forgot-step";
import { LoginStep } from "./sign-in-form/login-step";
import {
  composeLoginPhone,
  splitPastedPhone,
} from "./sign-in-form/phone-input";
import { useSignInForm } from "./sign-in-form/use-sign-in-form";

/**
 * Login by phone (SMS code) or by email + password.
 * One page: Role + method, then the SMS code, or the forgot-password step.
 */
export function SignInForm() {
  const t = useT();
  const { exiting, go } = useAuthNavigate();
  const form = useSignInForm();
  const [iso, setIso] = useState(DEFAULT_PHONE_ISO);
  const [national, setNational] = useState("");
  const [forgot, setForgot] = useState(false);

  const failCooldown = form.failedAttempts >= FAIL_THRESHOLD && form.inCooldown;
  // Ticking text must not be re-announced every second: use a stable message.
  const error = failCooldown
    ? "Too many incorrect codes. Wait for the timer, then request a new code."
    : form.displayError;

  useFeedbackToast(form.info, error);

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

  const codeStep = form.otpSent && form.method === "phone";

  return (
    <OnaScreen
      wordmark={!codeStep && !forgot}
      exiting={exiting}
      onBack={
        forgot
          ? () => setForgot(false)
          : codeStep
            ? () => form.onPhoneChange(form.phone)
            : leave
      }
      backLabel={t("common.back")}
      footer={
        codeStep || forgot ? null : (
          <button
            type="button"
            onClick={() => go("/signup")}
            className="mx-auto flex min-h-[44px] items-center border-0 bg-transparent text-[14px] font-semibold text-ona-brand-ink underline underline-offset-2"
          >
            {t("auth.newHere")}
          </button>
        )
      }
    >
      {forgot ? (
        <ForgotStep initialEmail={form.email} />
      ) : (
        <form onSubmit={form.onSubmit}>
          {codeStep ? (
            <CodeStep
              phone={form.phone}
              otp={form.otp}
              setOtp={form.setOtp}
              busy={form.busy}
              invalid={Boolean(error)}
              cooldownActive={failCooldown}
              cooldownLeft={form.cooldownLeft}
              onResend={() => void form.onSendCode()}
            />
          ) : (
            <LoginStep
              preferType={form.preferType}
              pickRole={form.pickRole}
              method={form.method}
              pickMethod={form.pickMethod}
              email={form.email}
              setEmail={form.setEmail}
              password={form.password}
              setPassword={form.setPassword}
              onForgot={() => setForgot(true)}
              iso={iso}
              national={national}
              onIsoChange={onIsoChange}
              onNationalChange={onNationalChange}
              showPhone={form.showPhone}
              busy={form.busy}
            />
          )}
        </form>
      )}
    </OnaScreen>
  );
}
