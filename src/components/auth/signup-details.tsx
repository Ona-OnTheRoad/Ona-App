"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { Button } from "@/components/ui/button";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { formatInternationalPhone } from "@/lib/phone-codes";
import {
  clearSignupDraft,
  saveSignupDraft,
  signupHref,
} from "@/lib/signup-draft";
import {
  accountValuesOf,
  identityConflict,
  validateDetails,
} from "./motorist-signup/motorist-validation";
import { splitFullName } from "./motorist-signup/name-utils";
import { StepDetails } from "./motorist-signup/step-details";
import { useMotoristFields } from "./motorist-signup/use-motorist-fields";

/**
 * "Create account": the details shared by Customer and Repair Pro. Saves a
 * sessionStorage draft (never a password) and continues to /signup/verify.
 * Menu/profile dual-signup (already signed in) skips straight to the Customer
 * wizard with the same query.
 */
export function SignupDetails() {
  const router = useRouter();
  const { exiting, go } = useAuthNavigate();
  const params = useSearchParams();
  const fields = useMotoristFields();
  const [formError, setFormError] = useState(params.get("err") || "");
  const from = params.get("from");
  const dualEntry = from === "menu" || from === "profile";

  const onContinue = () => {
    const values = accountValuesOf({
      ...fields,
      password: "",
      confirmPassword: "",
    });
    const err =
      validateDetails(values) ||
      identityConflict(
        values,
        formatInternationalPhone(fields.phoneDial, fields.phoneNational),
      );
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    const { first, last } = splitFullName(fields.fullName);
    saveSignupDraft({
      firstName: first,
      lastName: last,
      email: fields.email.trim(),
      phoneIso: fields.phoneIso,
      phoneDial: fields.phoneDial,
      phoneNational: fields.phoneNational,
      gender: fields.gender,
      dateOfBirth: fields.dateOfBirth,
      referral: fields.refInput.trim(),
      idNumber: fields.idNumber.trim(),
      bvn: fields.bvn.trim(),
    });
    const ref = fields.urlRef || fields.refInput.trim() || null;
    if (dualEntry) {
      const q = new URLSearchParams(params.toString());
      q.delete("err");
      router.replace(`/signup/motorist?${q.toString()}`);
      return;
    }
    go(signupHref("/signup/verify", { ref }));
  };

  const goBack = () => {
    if (dualEntry) {
      router.replace(from === "profile" ? "/profile" : "/dashboard");
      return;
    }
    try {
      sessionStorage.removeItem("ona-entry-done");
    } catch {
      /* ignore */
    }
    go("/login");
  };

  return (
    <OnaScreen
      wordmark
      exiting={exiting}
      onBack={dualEntry ? goBack : undefined}
      footer={
        <div className="flex flex-col gap-3">
          <Button size="ona" variant="ona" onClick={onContinue}>
            Continue
          </Button>
          <p className="text-center text-[11px] leading-snug text-ona-muted">
            Protected by Ona escrow and secure payments via Flutterwave.
          </p>
          {dualEntry ? null : (
            <p className="text-center text-[12px] text-ona-muted">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  clearSignupDraft();
                  go("/login/signin");
                }}
                className="inline-flex min-h-11 items-center border-0 bg-transparent p-0 font-semibold text-ona-brand-ink underline underline-offset-2"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      }
    >
      <OnaTitle
        className="pt-5"
        title="Create account"
        subtitle="Create your account to get started with Ona."
      />
      <div className="mt-5">
        <StepDetails
          f={fields}
          urlRef={fields.urlRef}
          refInput={fields.refInput}
          setRefInput={fields.setRefInput}
        />
        {formError ? (
          <p
            role="alert"
            className="mt-4 rounded-ona-ctl bg-ona-brand-soft px-3 py-2 text-[12px] font-medium leading-snug text-ona-danger"
          >
            {formError}
          </p>
        ) : null}
      </div>
    </OnaScreen>
  );
}
