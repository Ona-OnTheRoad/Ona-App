"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnaOtpInput } from "@/components/ui/ona-otp-input";
import { OnaTitle } from "@/components/ui/ona-screen";
import { useT } from "@/lib/i18n";
import { FeedbackLines } from "./feedback-lines";
import { formatCountdown, maskPhone } from "./phone-input";

/** Screen 2: OTP boxes, existing cooldown countdown / Resend, Verify. */
export function CodeStep({
  phone,
  otp,
  setOtp,
  info,
  error,
  busy,
  cooldownActive,
  cooldownLeft,
  onResend,
}: {
  phone: string;
  otp: string;
  setOtp: (v: string) => void;
  info: string;
  error: string;
  busy: boolean;
  /** True only during the failed-attempt cooldown (resend blocked). */
  cooldownActive: boolean;
  cooldownLeft: number;
  onResend: () => void;
}) {
  const t = useT();
  // Announce once when the cooldown ends (never every tick).
  const wasActive = useRef(false);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (cooldownActive) {
      wasActive.current = true;
      setExpired(false);
    } else if (wasActive.current) {
      wasActive.current = false;
      setExpired(true);
    }
  }, [cooldownActive]);

  return (
    <>
      <OnaTitle
        className="pt-2"
        title="Verify your number"
        subtitle={`Enter the 6-digit code sent to ${maskPhone(phone)}`}
      />
      <div className="mt-6 flex flex-col gap-4">
        <OnaOtpInput
          value={otp}
          onChange={setOtp}
          disabled={busy}
          invalid={Boolean(error)}
          label="SMS code"
          autoFocus
        />
        <div className="flex min-h-[44px] items-center justify-between">
          {cooldownActive ? (
            <span
              className="flex items-center gap-1.5 text-[13px] font-medium tabular-nums text-ona-ink"
              aria-live="off"
            >
              <Clock aria-hidden className="h-4 w-4" strokeWidth={2} />
              {formatCountdown(cooldownLeft)}
              <span className="sr-only"> until you can request a new code</span>
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={busy || cooldownActive}
            onClick={onResend}
            className="flex min-h-[44px] items-center border-0 bg-transparent text-[13px] font-medium text-ona-brand-ink underline underline-offset-2 disabled:text-ona-muted disabled:no-underline"
          >
            {t("auth.resendCode")}
          </button>
        </div>
        <p className="sr-only" role="status">
          {expired && !cooldownActive ? "You can request a new code now." : ""}
        </p>
        <FeedbackLines info={info} error={error} />
        <Button
          size="ona"
          variant="ona"
          type="submit"
          busy={busy}
          busyLabel={t("auth.pleaseWait")}
        >
          {t("auth.verifyAndLogin")}
        </Button>
      </div>
    </>
  );
}
