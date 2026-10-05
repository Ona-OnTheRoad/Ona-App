import {
  authLockedFieldClass,
  authLockedFieldStyle,
} from "@/components/auth/auth-plate";
import type { getPhoneCodeOptions } from "@/lib/phone-codes";
import { phoneNationalError } from "@/lib/signup-validation";
import { cn } from "@/lib/utils";
import { Field, FieldHint } from "./field-parts";
import type { ProFieldStyles } from "./field-styles";
import type { ProSignupForm } from "./use-pro-signup-form";

/** Country code + national number (shared by the About and Contact steps). */
export function PhoneField({
  form,
  styles,
  phoneCodes,
  inputRequired,
}: {
  form: ProSignupForm;
  styles: ProFieldStyles;
  phoneCodes: ReturnType<typeof getPhoneCodeOptions>;
  inputRequired?: boolean;
}) {
  const {
    phoneLocked,
    phoneIso,
    setPhoneIso,
    setPhoneDial,
    phoneNational,
    setPhoneNational,
    setFieldError,
    fieldErrors,
  } = form;
  return (
    <Field label="Phone" required>
      <div className="flex gap-1.5">
        <select
          className={cn(
            styles.selectClass,
            "max-w-[42%]",
            phoneLocked && authLockedFieldClass,
          )}
          style={phoneLocked ? authLockedFieldStyle : styles.fieldStyle}
          value={phoneIso}
          aria-label="Country code"
          disabled={phoneLocked}
          onChange={(e) => {
            if (phoneLocked) return;
            const iso = e.target.value;
            setPhoneIso(iso);
            const opt = phoneCodes.find((c) => c.iso === iso);
            if (opt) setPhoneDial(opt.dial);
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
            styles.fieldClass,
            "min-w-0 flex-1",
            phoneLocked && authLockedFieldClass,
          )}
          style={phoneLocked ? authLockedFieldStyle : styles.fieldStyle}
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
          autoComplete={inputRequired ? "tel-national" : undefined}
          required={inputRequired}
        />
      </div>
      <FieldHint message={fieldErrors.phone} />
    </Field>
  );
}
