import { Lock } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import { confirmPasswordError, passwordError } from "@/lib/signup-validation";
import { Field, FieldHint, PasswordRules } from "./form-parts";
import type { MotoristFields } from "./use-motorist-fields";

/** Dual signup reuses the Repair Pro password; otherwise password + confirm. */
export function AccountPasswordFields({
  f,
  dualPasswordOk,
}: {
  f: MotoristFields;
  dualPasswordOk: boolean;
}) {
  const {
    fieldErrors,
    setFieldError,
    dualSignup,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
  } = f;
  return (
    <>
      {dualSignup ? (
        <Field label="Same password as your Repair Pro account" required>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
            <PasswordField
              withLeftIcon
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
                    "Enter the same password as your Repair Pro account.",
                  );
                }
              }}
              placeholder="Your existing password"
              autoComplete="current-password"
            />
          </div>
          <p className="mt-1 text-[10px] leading-snug text-[#64748b]">
            No new password use the one you already signed up with.
          </p>
          <FieldHint message={fieldErrors.password} />
        </Field>
      ) : (
        <>
          <Field label="Password" required>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <PasswordField
                withLeftIcon
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
                onBlur={() =>
                  setFieldError("password", passwordError(password))
                }
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <PasswordRules password={password} />
            <FieldHint message={fieldErrors.password} />
          </Field>

          <Field label="Confirm password" required>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <PasswordField
                withLeftIcon
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
            </div>
            <FieldHint message={fieldErrors.confirm} />
          </Field>
        </>
      )}
    </>
  );
}
