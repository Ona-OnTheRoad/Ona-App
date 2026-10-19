import { useEffect, useState } from "react";
import { OnaField, OnaInput, OnaSelect } from "@/components/ui/ona-field";
import {
  dobError,
  dobInputMax,
  dobInputMin,
  emailError,
  fullNameError,
  genderError,
  normalizeDobIso,
  phoneNationalError,
  SIGNUP_GENDER_OPTIONS,
  type SignupGender,
} from "@/lib/signup-validation";
import { cn } from "@/lib/utils";
import { composeFullName, splitFullName } from "./name-utils";
import type { MotoristFields } from "./use-motorist-fields";

const LOCKED = "cursor-not-allowed opacity-60";

/** First/last name, email, phone, gender and date of birth (Create account screen). */
export function AccountIdentityFields({ f }: { f: MotoristFields }) {
  const {
    phoneCodes,
    fieldErrors,
    setFieldError,
    fullName,
    setFullName,
    gender,
    setGender,
    dateOfBirth,
    setDateOfBirth,
    phoneIso,
    setPhoneIso,
    setPhoneDial,
    phoneNational,
    setPhoneNational,
    email,
    setEmail,
    setIdNumber,
    setBvn,
    nameLocked,
    genderLocked,
    phoneLocked,
    emailLocked,
  } = f;

  // Local first/last so typing never re-splits; fullName stays the stored value.
  const [parts, setParts] = useState(() => splitFullName(fullName));
  // Re-sync when fullName changes from outside (draft hydration, profile prefill).
  useEffect(() => {
    setParts((p) =>
      composeFullName(p.first, p.last) === fullName.trim()
        ? p
        : splitFullName(fullName),
    );
  }, [fullName]);
  const shown = nameLocked ? splitFullName(fullName) : parts;
  const setPart = (key: "first" | "last", v: string) => {
    if (nameLocked) return;
    const next = { ...parts, [key]: v };
    setParts(next);
    setFullName(composeFullName(next.first, next.last));
    setFieldError("fullName", null);
  };
  const checkName = () => {
    const composed = composeFullName(shown.first, shown.last);
    setFieldError("fullName", composed ? fullNameError(composed) : null);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <OnaField label="First name" required>
          {({ id, describedBy }) => (
            <OnaInput
              id={id}
              aria-describedby={describedBy}
              className={cn(nameLocked && LOCKED)}
              value={shown.first}
              readOnly={nameLocked}
              tabIndex={nameLocked ? -1 : undefined}
              onChange={(e) => setPart("first", e.target.value)}
              onBlur={() => shown.last && checkName()}
              placeholder="e.g. Sarah"
              autoComplete="given-name"
            />
          )}
        </OnaField>
        <OnaField label="Last name" required>
          {({ id, describedBy }) => (
            <OnaInput
              id={id}
              aria-describedby={describedBy}
              className={cn(nameLocked && LOCKED)}
              value={shown.last}
              readOnly={nameLocked}
              tabIndex={nameLocked ? -1 : undefined}
              onChange={(e) => setPart("last", e.target.value)}
              onBlur={checkName}
              placeholder="e.g. Jenkins"
              autoComplete="family-name"
            />
          )}
        </OnaField>
      </div>
      {fieldErrors.fullName ? (
        <p
          role="alert"
          className="-mt-2 text-[12px] font-medium text-ona-danger"
        >
          {fieldErrors.fullName}
        </p>
      ) : null}

      <OnaField label="Email address" required error={fieldErrors.email}>
        {({ id, describedBy, invalid }) => (
          <OnaInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            className={cn(emailLocked && LOCKED)}
            value={email}
            readOnly={emailLocked}
            tabIndex={emailLocked ? -1 : undefined}
            onChange={(e) => {
              if (emailLocked) return;
              setEmail(e.target.value);
              setFieldError("email", null);
            }}
            onBlur={() => setFieldError("email", emailError(email))}
            placeholder="name@example.com"
            type="email"
            autoComplete="email"
            required
          />
        )}
      </OnaField>

      <OnaField label="Phone number" required error={fieldErrors.phone}>
        {({ id, describedBy, invalid }) => (
          <div className="flex gap-2">
            <OnaSelect
              wrapperClassName="w-[44%] shrink-0"
              className={cn(phoneLocked && LOCKED)}
              value={phoneIso}
              aria-label="Country code"
              disabled={phoneLocked}
              onChange={(e) => {
                if (phoneLocked) return;
                const iso = e.target.value;
                setPhoneIso(iso);
                const opt = phoneCodes.find((c) => c.iso === iso);
                if (opt) setPhoneDial(opt.dial);
                // Country change → clear IDs and force re-entry
                setIdNumber("");
                setBvn("");
                setFieldError("nin", null);
                setFieldError("bvn", null);
              }}
            >
              {phoneCodes.map((c) => (
                <option key={`${c.iso}-${c.dial}`} value={c.iso}>
                  {c.label} {c.name}
                </option>
              ))}
            </OnaSelect>
            <OnaInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              className={cn("min-w-0 flex-1", phoneLocked && LOCKED)}
              value={phoneNational}
              readOnly={phoneLocked}
              tabIndex={phoneLocked ? -1 : undefined}
              onChange={(e) => {
                if (phoneLocked) return;
                setPhoneNational(
                  e.target.value.replace(/\D/g, "").slice(0, 15),
                );
                setFieldError("phone", null);
              }}
              onBlur={() =>
                setFieldError("phone", phoneNationalError(phoneNational))
              }
              placeholder="8012345678"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
            />
          </div>
        )}
      </OnaField>

      <div className="grid grid-cols-2 gap-3">
        <OnaField label="Gender" required error={fieldErrors.gender}>
          {({ id, describedBy, invalid }) => (
            <OnaSelect
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              className={cn(genderLocked && LOCKED)}
              value={gender}
              disabled={genderLocked}
              onChange={(e) => {
                if (genderLocked) return;
                setGender(e.target.value as SignupGender | "");
                setFieldError("gender", null);
              }}
              onBlur={() => setFieldError("gender", genderError(gender))}
              required
            >
              <option value="">e.g. Male</option>
              {SIGNUP_GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </OnaSelect>
          )}
        </OnaField>
        <OnaField label="Date of birth" required error={fieldErrors.dob}>
          {({ id, describedBy, invalid }) => (
            <OnaInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              type="date"
              value={dateOfBirth}
              min={dobInputMin()}
              max={dobInputMax()}
              autoComplete="off"
              onChange={(e) => {
                const v = e.target.value;
                setDateOfBirth(normalizeDobIso(v) || v);
                setFieldError("dob", null);
              }}
              onBlur={(e) =>
                setFieldError("dob", dobError(e.target.value || dateOfBirth))
              }
              required
            />
          )}
        </OnaField>
      </div>
    </>
  );
}
