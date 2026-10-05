import {
  authLockedFieldClass,
  authLockedFieldStyle,
} from "@/components/auth/auth-plate";
import { PasswordField } from "@/components/auth/password-field";
import { IDENTITY_RULE_COPY } from "@/lib/account-registry";
import type { getPhoneCodeOptions } from "@/lib/phone-codes";
import {
  bvnError,
  confirmPasswordError,
  emailError,
  ninError,
  passwordError,
} from "@/lib/signup-validation";
import { cn } from "@/lib/utils";
import { Field, FieldHint, PasswordRules } from "./field-parts";
import type { ProFieldStyles } from "./field-styles";
import { PhoneField } from "./phone-field";
import type { ProSignupForm } from "./use-pro-signup-form";
import { isDualPasswordOk } from "./validation";

/** Step 5: Contact & security. */
export function StepContact({
  form,
  styles,
  phoneCodes,
  formError,
}: {
  form: ProSignupForm;
  styles: ProFieldStyles;
  phoneCodes: ReturnType<typeof getPhoneCodeOptions>;
  formError: string;
}) {
  const {
    dualSignup,
    emailLocked,
    ninLocked,
    bvnLocked,
    email,
    setEmail,
    idNumber,
    setIdNumber,
    bvn,
    setBvn,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    setFieldError,
    fieldErrors,
  } = form;
  const dualPasswordOk = isDualPasswordOk(password);
  return (
    <div className="flex flex-col gap-1.5">
      {dualSignup ? (
        <p className="rounded-md bg-[#e8e9ed] px-2.5 py-2 text-center text-[11px] leading-snug text-[#334155]">
          Continue from your Customer account
        </p>
      ) : (
        <p className="text-center text-[10px] leading-snug text-[#475569]">
          {IDENTITY_RULE_COPY}
        </p>
      )}
      {formError && (
        <p
          className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] font-medium leading-snug text-red-700"
          role="alert"
        >
          {formError}
        </p>
      )}
      <PhoneField form={form} styles={styles} phoneCodes={phoneCodes} />
      <Field label="Email" required>
        <input
          className={cn(styles.fieldClass, emailLocked && authLockedFieldClass)}
          style={emailLocked ? authLockedFieldStyle : styles.fieldStyle}
          value={email}
          readOnly={emailLocked}
          tabIndex={emailLocked ? -1 : undefined}
          onChange={(e) => {
            if (emailLocked) return;
            setEmail(e.target.value);
            setFieldError("email", null);
          }}
          onBlur={() => setFieldError("email", emailError(email))}
          placeholder="pro@email.com"
          type="email"
          autoComplete="email"
          required
        />
        <FieldHint message={fieldErrors.email} />
      </Field>
      <Field label="NIN">
        <input
          className={cn(styles.fieldClass, ninLocked && authLockedFieldClass)}
          style={ninLocked ? authLockedFieldStyle : styles.fieldStyle}
          value={idNumber}
          readOnly={ninLocked}
          tabIndex={ninLocked ? -1 : undefined}
          onChange={(e) => {
            if (ninLocked) return;
            setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 11));
            setFieldError("nin", null);
          }}
          onBlur={() => setFieldError("nin", ninError(idNumber))}
          placeholder="NIN"
          inputMode="numeric"
          maxLength={11}
        />
        <FieldHint message={fieldErrors.nin} />
      </Field>
      <Field label="BVN">
        <input
          className={cn(styles.fieldClass, bvnLocked && authLockedFieldClass)}
          style={bvnLocked ? authLockedFieldStyle : styles.fieldStyle}
          value={bvn}
          readOnly={bvnLocked}
          tabIndex={bvnLocked ? -1 : undefined}
          onChange={(e) => {
            if (bvnLocked) return;
            setBvn(e.target.value.replace(/\D/g, "").slice(0, 11));
            setFieldError("bvn", null);
          }}
          onBlur={() => setFieldError("bvn", bvnError(bvn))}
          placeholder="BVN"
          inputMode="numeric"
          maxLength={11}
        />
        <FieldHint message={fieldErrors.bvn} />
      </Field>
      {dualSignup ? (
        <Field label="Same password as your Customer account" required>
          <PasswordField
            value={password}
            onChange={(e) => {
              const v = e.target.value;
              setPassword(v);
              setConfirmPassword(v);
              setFieldError("password", null);
            }}
            onBlur={() => {
              if (!dualPasswordOk) {
                setFieldError(
                  "password",
                  "Enter the same password as your Customer account.",
                );
              }
            }}
            placeholder="Your existing password"
            autoComplete="current-password"
          />
          <p className="mt-1 text-[10px] leading-snug text-[#64748b]">
            No new password use the one you already signed up with.
          </p>
          <FieldHint message={fieldErrors.password} />
        </Field>
      ) : (
        <>
          <Field label="Password" required>
            <PasswordField
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldError("password", null);
                if (confirmPassword) {
                  setFieldError(
                    "confirm",
                    confirmPasswordError(e.target.value, confirmPassword),
                  );
                }
              }}
              onBlur={() => setFieldError("password", passwordError(password))}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <PasswordRules password={password} inline />
            <FieldHint message={fieldErrors.password} />
          </Field>
          <Field label="Confirm password" required>
            <PasswordField
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldError(
                  "confirm",
                  e.target.value
                    ? confirmPasswordError(password, e.target.value)
                    : null,
                );
              }}
              onBlur={() =>
                setFieldError(
                  "confirm",
                  confirmPasswordError(password, confirmPassword),
                )
              }
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
            <FieldHint message={fieldErrors.confirm} />
          </Field>
        </>
      )}
    </div>
  );
}
