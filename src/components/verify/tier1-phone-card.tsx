"use client";

import { CheckCircle2, Phone } from "lucide-react";
import { CUSTOMER_PHONE_OTP } from "@/lib/verification-gate";

interface Tier1PhoneCardProps {
  isLight?: boolean;
  phoneOk: boolean;
  phone?: string;
  otp: string;
  setOtp: (v: string) => void;
  otpBusy: boolean;
  otpMsg: string | null;
  sendDemoOtp: () => void;
  confirmPhone: () => Promise<void>;
}

export function Tier1PhoneCard({
  phoneOk,
  phone,
  otp,
  setOtp,
  otpBusy,
  otpMsg,
  sendDemoOtp,
  confirmPhone,
}: Tier1PhoneCardProps) {
  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-4.5 transition-colors shadow-xs">
      {/* Header Row: TIER 1 + Verified status */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ona-muted">
          TIER 1
        </span>

        {phoneOk ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ona-success">
            <span>Verified</span>
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
          </span>
        ) : (
          <span className="text-[12px] font-semibold text-amber-500">
            Action required
          </span>
        )}
      </div>

      {/* Row Item: Brand soft icon box + Phone number label */}
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ona-brand-soft">
          <Phone className="h-3.5 w-3.5 text-brand" strokeWidth={2.4} />
        </div>
        <span className="text-[12px] font-medium leading-tight text-ona-ink">
          Phone number
        </span>
      </div>

      {/* Divider */}
      <div className="border-b border-ona-border my-3.5" />

      {/* Subtitle / Unverified Flow */}
      {phoneOk ? (
        <p className="text-[13px] leading-normal font-normal text-ona-muted">
          Free booking for 30 days from your first request.
        </p>
      ) : (
        <div className="space-y-3 pt-0.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-ona-muted">
              {phone || "No phone on account"}
            </span>
            <button
              type="button"
              onClick={sendDemoOtp}
              className="font-bold text-brand hover:underline"
            >
              Send code
            </button>
          </div>

          {otpMsg ? (
            <p className="text-[11px] leading-snug text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-ona-ctl">
              {otpMsg}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <input
              id="tier1-otp-input"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder={CUSTOMER_PHONE_OTP}
              inputMode="numeric"
              maxLength={6}
              className="h-10 flex-1 rounded-ona-ctl border border-ona-border bg-ona-field px-3 text-[14px] font-medium text-ona-ink placeholder:text-ona-muted transition-colors focus:outline-none focus:border-ona-ink"
            />
            <button
              type="button"
              disabled={otpBusy || otp.length < 4}
              onClick={() => void confirmPhone()}
              className="h-10 px-4 rounded-ona-ctl bg-brand hover:opacity-90 text-white text-[13px] font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {otpBusy ? "Checking…" : "Verify"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
