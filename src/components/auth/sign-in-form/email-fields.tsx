"use client";

import {
  OnaField,
  OnaInput,
  OnaPasswordInput,
} from "@/components/ui/ona-field";
import { useT } from "@/lib/i18n";

/** Email + password inputs with a "Forgot password?" link. */
export function EmailFields({
  email,
  setEmail,
  password,
  setPassword,
  onForgot,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onForgot: () => void;
}) {
  const t = useT();
  return (
    <>
      <OnaField label={t("auth.email")}>
        {({ id, describedBy, invalid }) => (
          <OnaInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        )}
      </OnaField>
      <div>
        <OnaField label={t("auth.password")}>
          {({ id, describedBy, invalid }) => (
            <OnaPasswordInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          )}
        </OnaField>
        <button
          type="button"
          onClick={onForgot}
          className="ml-auto mt-1 flex min-h-[44px] items-center border-0 bg-transparent text-[13px] font-semibold text-ona-brand-ink"
        >
          {t("auth.forgotPassword")}
        </button>
      </div>
    </>
  );
}
