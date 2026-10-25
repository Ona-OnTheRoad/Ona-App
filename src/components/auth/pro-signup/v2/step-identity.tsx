"use client";

import { useState } from "react";
import { OnaSelect } from "@/components/ui/ona-field";
import {
  dobError,
  dobInputMax,
  dobInputMin,
  genderError,
  normalizeDobIso,
  SIGNUP_GENDER_OPTIONS,
  type SignupGender,
} from "@/lib/signup-validation";

interface StepIdentityProps {
  gender: SignupGender | "";
  setGender: (g: SignupGender | "") => void;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  /** Known values are not asked for again. */
  genderLocked?: boolean;
  dobLocked?: boolean;
  onContinue: () => void;
}

/** Collects the details the server requires that the wizard did not already have. */
export function StepIdentity({
  gender,
  setGender,
  dateOfBirth,
  setDateOfBirth,
  genderLocked,
  dobLocked,
  onContinue,
}: StepIdentityProps) {
  const [touched, setTouched] = useState(false);
  const gErr = genderLocked ? null : genderError(gender);
  const dErr = dobLocked ? null : dobError(dateOfBirth);
  const valid = !gErr && !dErr;

  return (
    <div className="flex flex-col flex-1 px-5 pt-4 pb-10 bg-ona-bg text-ona-ink">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ona-ink tracking-tight">
          A few details to finish your profile
        </h1>
        <p className="mt-1.5 text-xs text-ona-muted leading-relaxed">
          We need these to set up your Repair Pro account.
        </p>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {genderLocked ? null : (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="identity-gender"
              className="text-xs font-semibold text-ona-ink"
            >
              Gender
            </label>
            <OnaSelect
              id="identity-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as SignupGender)}
              invalid={touched && Boolean(gErr)}
            >
              <option value="">Select</option>
              {SIGNUP_GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </OnaSelect>
            {touched && gErr ? (
              <p
                role="alert"
                className="text-[12px] font-medium text-ona-danger"
              >
                {gErr}
              </p>
            ) : null}
          </div>
        )}

        {dobLocked ? null : (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="identity-dob"
              className="text-xs font-semibold text-ona-ink"
            >
              Date of birth
            </label>
            <input
              id="identity-dob"
              type="date"
              value={dateOfBirth}
              min={dobInputMin()}
              max={dobInputMax()}
              onChange={(e) =>
                setDateOfBirth(
                  normalizeDobIso(e.target.value) || e.target.value,
                )
              }
              onBlur={() => setTouched(true)}
              className="h-12 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-3.5 text-[14px] font-medium text-ona-ink outline-none focus:border-ona-ink"
            />
            {touched && dErr ? (
              <p
                role="alert"
                className="text-[12px] font-medium text-ona-danger"
              >
                {dErr}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="pt-6">
        <button
          type="button"
          onClick={() => {
            setTouched(true);
            if (valid) onContinue();
          }}
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer ${
            valid
              ? "bg-brand hover:opacity-90 text-white active:scale-[0.99]"
              : "bg-brand/50 text-white"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
