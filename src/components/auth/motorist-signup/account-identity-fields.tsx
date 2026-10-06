import { Mail, User } from "lucide-react";
import {
  authFieldClass as fieldClass,
  authFieldIconClass as fieldIconClass,
  authLockedFieldClass,
  authLockedFieldStyle,
  authSelectClass as selectClass,
} from "@/components/auth/auth-plate";
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
import { Field, FieldHint } from "./form-parts";
import type { MotoristFields } from "./use-motorist-fields";

/** Name, gender, date of birth, phone and email inputs (account step). */
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
  return (
    <>
      <Field label="Full name" required>
        <div className="relative">
          <User className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
          <input
            className={cn(fieldIconClass, nameLocked && authLockedFieldClass)}
            style={nameLocked ? authLockedFieldStyle : undefined}
            value={fullName}
            readOnly={nameLocked}
            tabIndex={nameLocked ? -1 : undefined}
            onChange={(e) => {
              if (nameLocked) return;
              setFullName(e.target.value);
              setFieldError("fullName", null);
            }}
            onBlur={() => setFieldError("fullName", fullNameError(fullName))}
            placeholder="e.g. Ada Okafor"
            autoComplete="name"
          />
        </div>
        <FieldHint message={fieldErrors.fullName} />
      </Field>

      <div className="grid grid-cols-2 gap-1.5">
        <Field label="Gender" required>
          <select
            className={cn(selectClass, genderLocked && authLockedFieldClass)}
            style={genderLocked ? authLockedFieldStyle : undefined}
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
            <option value="">Select</option>
            {SIGNUP_GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldHint message={fieldErrors.gender} />
        </Field>
        <Field label="Date of birth" required>
          <input
            type="date"
            className={fieldClass}
            value={dateOfBirth}
            min={dobInputMin()}
            max={dobInputMax()}
            autoComplete="off"
            // Empty until the customer picks a date no pre-filled value
            placeholder=""
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
          <FieldHint message={fieldErrors.dob} />
        </Field>
      </div>

      <Field label="Phone" required>
        <div className="flex gap-1.5">
          <select
            className={cn(
              selectClass,
              "max-w-[42%]",
              phoneLocked && authLockedFieldClass,
            )}
            style={phoneLocked ? authLockedFieldStyle : undefined}
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
          </select>
          <input
            className={cn(
              fieldClass,
              "min-w-0 flex-1",
              phoneLocked && authLockedFieldClass,
            )}
            style={phoneLocked ? authLockedFieldStyle : undefined}
            value={phoneNational}
            readOnly={phoneLocked}
            tabIndex={phoneLocked ? -1 : undefined}
            onChange={(e) => {
              if (phoneLocked) return;
              setPhoneNational(e.target.value.replace(/\D/g, "").slice(0, 15));
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
        <FieldHint message={fieldErrors.phone} />
      </Field>

      <Field label="Email" required>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
          <input
            className={cn(fieldIconClass, emailLocked && authLockedFieldClass)}
            style={emailLocked ? authLockedFieldStyle : undefined}
            value={email}
            readOnly={emailLocked}
            tabIndex={emailLocked ? -1 : undefined}
            onChange={(e) => {
              if (emailLocked) return;
              setEmail(e.target.value);
              setFieldError("email", null);
            }}
            onBlur={() => setFieldError("email", emailError(email))}
            placeholder="you@email.com"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <FieldHint message={fieldErrors.email} />
      </Field>
    </>
  );
}
