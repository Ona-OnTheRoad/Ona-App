"use client";

import { useMemo } from "react";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnaField, OnaInput, OnaSelect } from "@/components/ui/ona-field";
import { OnaSegmented } from "@/components/ui/ona-segmented";
import { OnaTitle } from "@/components/ui/ona-screen";
import { flagEmoji, getPhoneCodeOptions } from "@/lib/phone-codes";
import { useT } from "@/lib/i18n";
import type { AccountType } from "@/lib/types";
import { EmailFields } from "./email-fields";
import type { LoginMethod } from "./helpers";

/**
 * Screen 1: role tabs, email login first (email + password + Log in),
 * and option to sign in with phone as the second option (or switch back to email).
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
            <Button
              size="ona"
              variant="ona"
              type="submit"
              busy={busy}
              busyLabel={t("auth.pleaseWait")}
            >
              {t("auth.logIn")}
            </Button>

            <div className="relative my-1 flex items-center justify-center">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-ona-border" />
              </div>
              <span className="relative bg-white px-3 text-[12px] font-medium text-ona-muted">
                or
              </span>
            </div>

            <Button
              size="ona"
              variant="onaOutline"
              type="button"
              onClick={() => pickMethod("phone")}
            >
              <Phone className="mr-2 h-4 w-4 text-ona-muted" />
              Sign in with phone
            </Button>
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
            <Button
              size="ona"
              variant="ona"
              type="submit"
              busy={busy}
              busyLabel={t("auth.pleaseWait")}
            >
              Send code
            </Button>

            <div className="relative my-1 flex items-center justify-center">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-ona-border" />
              </div>
              <span className="relative bg-white px-3 text-[12px] font-medium text-ona-muted">
                or
              </span>
            </div>

            <Button
              size="ona"
              variant="onaOutline"
              type="button"
              onClick={() => pickMethod("email")}
            >
              <Mail className="mr-2 h-4 w-4 text-ona-muted" />
              Sign in with email
            </Button>
          </>
        ) : null}
      </div>
    </>
  );
}
