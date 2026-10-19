"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { OnaField, OnaInput, OnaSelect } from "@/components/ui/ona-field";
import { OnaSegmented } from "@/components/ui/ona-segmented";
import { OnaTitle } from "@/components/ui/ona-screen";
import { getPhoneCodeOptions } from "@/lib/phone-codes";
import { useT } from "@/lib/i18n";
import type { AccountType } from "@/lib/types";
import { FeedbackLines } from "./feedback-lines";

/** Screen 1: role tabs, phone row, Send code. */
export function PhoneStep({
  preferType,
  pickRole,
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
        subtitle="Use the exact phone number you registered at signup. We will text you a code."
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

        {showPhone ? (
          <>
            <OnaField label={t("auth.phone")} required>
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
                        {o.iso} {o.label}
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
          </>
        ) : (
          <FeedbackLines info={info} error={error} />
        )}
      </div>
    </>
  );
}
