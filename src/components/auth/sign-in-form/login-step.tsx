"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { OnaField, OnaInput, OnaSelect } from "@/components/ui/ona-field";
import { OnaSegmented } from "@/components/ui/ona-segmented";
import { OnaTitle } from "@/components/ui/ona-screen";
import { flagEmoji, getPhoneCodeOptions } from "@/lib/phone-codes";
import { useT } from "@/lib/i18n";
import type { AccountType } from "@/lib/types";
import { EmailFields } from "./email-fields";
import { FeedbackLines } from "./feedback-lines";
import type { LoginMethod } from "./helpers";

/** "Log in with email instead" / "…with phone instead" text switch. */
function MethodSwitch({
  method,
  onPick,
}: {
  method: LoginMethod;
  onPick: (m: LoginMethod) => void;
}) {
  const next: LoginMethod = method === "email" ? "phone" : "email";
  return (
    <button
      type="button"
      onClick={() => onPick(next)}
      className="mx-auto flex min-h-11 items-center border-0 bg-transparent text-[13px] font-semibold text-ona-brand-ink underline underline-offset-2"
    >
      {next === "email"
        ? "Log in with email instead"
        : "Log in with phone number instead"}
    </button>
  );
}

/**
 * Screen 1: role tabs, then phone row + Send code or email + password + Log in.
 * The method is switched with a text link under the form (one tab row, as designed).
 */
export function LoginStep({
  preferType,
  pickRole,
  method,
  pickMethod,
  email,
  setEmail,
  password,
  setPassword,
  onForgot,
  iso,
  national,
  onIsoChange,
  onNationalChange,
  showPhone,
  info,
  error,
  busy,
}: {
  preferType: AccountType | "";
  pickRole: (t: AccountType) => void;
  method: LoginMethod;
  pickMethod: (m: LoginMethod) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onForgot: () => void;
  iso: string;
  national: string;
  onIsoChange: (iso: string) => void;
  onNationalChange: (value: string) => void;
  showPhone: boolean;
  info: string;
  error: string;
  busy: boolean;
}) {
  const t = useT();
  const options = useMemo(() => getPhoneCodeOptions(), []);

  return (
    <>
      <OnaTitle
        className="pt-5"
        title={t("auth.logIn")}
        subtitle={
          method === "email"
            ? "Log in with the email and password you signed up with."
            : "Use the exact phone number you registered at signup. We will text you a code."
        }
      />
      <div className="mt-5 flex flex-col gap-5">
        <OnaSegmented<AccountType>
          label={t("auth.loginAs")}
          value={preferType}
          onChange={pickRole}
          options={[
            { value: "motorist", label: t("auth.motorist") },
            { value: "professional", label: t("auth.pro") },
          ]}
        />

        {showPhone && method === "email" ? (
          <>
            <EmailFields
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onForgot={onForgot}
            />
            <FeedbackLines info={info} error={error} />
            <Button
              size="ona"
              variant="ona"
              type="submit"
              busy={busy}
              busyLabel={t("auth.pleaseWait")}
            >
              {t("auth.logIn")}
            </Button>
            <MethodSwitch method={method} onPick={pickMethod} />
          </>
        ) : showPhone ? (
          <>
            <OnaField label={t("auth.phone")}>
              {({ id, describedBy, invalid }) => (
                <div className="flex gap-2">
                  <OnaSelect
                    aria-label="Country code"
                    wrapperClassName="w-[112px] shrink-0"
                    value={iso}
                    onChange={(e) => onIsoChange(e.target.value)}
                  >
                    {options.map((o) => (
                      <option key={o.iso} value={o.iso}>
                        {flagEmoji(o.iso)} {o.label}
                      </option>
                    ))}
                  </OnaSelect>
                  <OnaInput
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    className="min-w-0 flex-1"
                    type="tel"
                    autoComplete="tel-national"
                    inputMode="tel"
                    value={national}
                    onChange={(e) => onNationalChange(e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              )}
            </OnaField>
            <FeedbackLines info={info} error={error} />
            <Button
              size="ona"
              variant="ona"
              type="submit"
              busy={busy}
              busyLabel={t("auth.pleaseWait")}
            >
              Send code
            </Button>
            <MethodSwitch method={method} onPick={pickMethod} />
          </>
        ) : (
          <FeedbackLines info={info} error={error} />
        )}
      </div>
    </>
  );
}
