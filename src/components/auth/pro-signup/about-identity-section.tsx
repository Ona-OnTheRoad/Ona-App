import { SheetSelect } from "@/components/ui/option-sheet";
import { Briefcase, User } from "lucide-react";
import {
  authLockedFieldClass,
  authLockedFieldStyle,
} from "@/components/auth/auth-plate";
import type { getPhoneCodeOptions } from "@/lib/phone-codes";
import {
  dobError,
  dobInputMax,
  dobInputMin,
  normalizeDobIso,
  SIGNUP_GENDER_OPTIONS,
  type SignupGender,
} from "@/lib/signup-validation";
import { cn } from "@/lib/utils";
import { Field, FieldHint, RequiredMark } from "./field-parts";
import type { ProFieldStyles } from "./field-styles";
import { PhoneField } from "./phone-field";
import type { ProSignupForm } from "./use-pro-signup-form";

/** Step 4, part 1: name, gender, date of birth, phone, business. */
export function AboutIdentitySection({
  form,
  styles,
  phoneCodes,
}: {
  form: ProSignupForm;
  styles: ProFieldStyles;
  phoneCodes: ReturnType<typeof getPhoneCodeOptions>;
}) {
  const {
    nameLocked,
    genderLocked,
    dobLocked,
    fullName,
    setFullName,
    gender,
    setGender,
    dateOfBirth,
    setDateOfBirth,
    businessName,
    setBusinessName,
    setFieldError,
    fieldErrors,
  } = form;
  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">
          Your name
        </p>
        <p className="mt-0.5 text-[12px] text-[#475569]">
          This is how customers will see you
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[12px] font-semibold text-[#475569]">
          Full name
          <RequiredMark />
        </span>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            className={cn(
              styles.fieldIconClass,
              nameLocked && authLockedFieldClass,
            )}
            style={nameLocked ? authLockedFieldStyle : styles.fieldStyle}
            value={fullName}
            readOnly={nameLocked}
            tabIndex={nameLocked ? -1 : undefined}
            onChange={(e) => {
              if (!nameLocked) setFullName(e.target.value);
            }}
            placeholder="e.g. Adaobi Okeke"
            autoComplete="name"
            required
          />
        </div>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold text-[#475569]">
            Gender
            <RequiredMark />
          </span>
          <SheetSelect
            bare
            title="Gender"
            className={cn(
              styles.selectClass,
              genderLocked && authLockedFieldClass,
            )}
            style={genderLocked ? authLockedFieldStyle : styles.fieldStyle}
            value={gender}
            disabled={genderLocked}
            placeholder="Select"
            options={SIGNUP_GENDER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(v) => setGender(v as SignupGender | "")}
          />
        </label>
        <Field label="Date of birth" required>
          <input
            type="date"
            className={cn(styles.fieldClass, dobLocked && authLockedFieldClass)}
            style={dobLocked ? authLockedFieldStyle : styles.fieldStyle}
            value={dateOfBirth}
            readOnly={dobLocked}
            tabIndex={dobLocked ? -1 : undefined}
            min={dobInputMin()}
            max={dobInputMax()}
            onChange={(e) => {
              if (dobLocked) return;
              setDateOfBirth(normalizeDobIso(e.target.value) || e.target.value);
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

      <PhoneField
        form={form}
        styles={styles}
        phoneCodes={phoneCodes}
        inputRequired
      />

      <label className="block">
        <span className="mb-1.5 block text-[12px] font-semibold text-[#475569]">
          Business / workshop
          <RequiredMark />
        </span>
        <div className="relative">
          <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            className={styles.fieldIconClass}
            style={styles.fieldStyle}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Okafor Auto Care"
            required
          />
        </div>
      </label>
    </section>
  );
}
