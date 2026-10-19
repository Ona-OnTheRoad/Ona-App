import { OnaField, OnaPasswordInput } from "@/components/ui/ona-field";
import { OnaRuleList } from "@/components/ui/ona-rule-list";
import {
  confirmPasswordError,
  passwordError,
  passwordRules,
} from "@/lib/signup-validation";
import type { MotoristFields } from "./use-motorist-fields";

/** Dual signup reuses the Repair Pro password; otherwise password + rules + confirm. */
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

  if (dualSignup) {
    return (
      <OnaField
        label="Same password as your Repair Pro account"
        required
        error={fieldErrors.password}
        hint="No new password. Use the one you already signed up with."
      >
        {({ id, describedBy, invalid }) => (
          <OnaPasswordInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
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
        )}
      </OnaField>
    );
  }

  const r = passwordRules(password);
  return (
    <>
      <OnaField label="Password" required error={fieldErrors.password}>
        {({ id, describedBy, invalid }) => (
          <OnaPasswordInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
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
            placeholder="Create a password"
            autoComplete="new-password"
          />
        )}
      </OnaField>

      <OnaRuleList
        title="Password requirements"
        rules={[
          { ok: r.length, text: "At least 8 characters" },
          { ok: r.upper, text: "At least 1 capital letter" },
          { ok: r.digit, text: "At least 1 number" },
        ]}
      />

      <OnaField label="Confirm password" required error={fieldErrors.confirm}>
        {({ id, describedBy, invalid }) => (
          <OnaPasswordInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
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
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
        )}
      </OnaField>
    </>
  );
}
