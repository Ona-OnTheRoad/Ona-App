"use client";

import { CheckCircle2, Phone } from "lucide-react";
import {
  authFieldClass,
  authLabelClass,
  authPrimaryBtnClass,
  authPrimaryBtnStyle,
} from "@/components/auth/auth-plate";
import { CUSTOMER_PHONE_OTP } from "@/lib/verification-gate";
import { cn } from "@/lib/utils";

/** Tier 1 Phone */
export function PhoneTierCard({
  card,
  ink,
  muted,
  phoneOk,
  phone,
  otp,
  setOtp,
  otpBusy,
  otpMsg,
  sendDemoOtp,
  confirmPhone,
}: {
  card: string;
  ink: string;
  muted: string;
  phoneOk: boolean;
  phone: string | undefined;
  otp: string;
  setOtp: (v: string) => void;
  otpBusy: boolean;
  otpMsg: string | null;
  sendDemoOtp: () => void;
  confirmPhone: () => Promise<void>;
}) {
  return (
    <section className={cn("rounded-xl px-3 py-3", card)}>
      <p className={cn("flex items-center gap-1.5 text-[12px] font-bold", ink)}>
        <Phone className="h-3.5 w-3.5 text-[#FF6B35]" />
        Tier 1 · Phone
      </p>
      <p className={cn("mt-1 text-[11px] leading-snug", muted)}>
        {phoneOk
          ? "Phone checked. Free booking for 30 days from your first request."
          : "Confirm your phone with a one-time code."}
      </p>
      {phoneOk ? (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> {phone || "Phone verified"}
        </p>
      ) : (
        <>
          <p className={cn("mt-2 text-[11px] font-medium", muted)}>
            {phone || "No phone on account"}
          </p>
          <button
            type="button"
            onClick={sendDemoOtp}
            className="mt-1.5 text-[11px] font-bold text-[#FF6B35]"
          >
            Send code
          </button>
          {otpMsg ? (
            <p className={cn("mt-1 text-[10px] leading-snug", muted)}>
              {otpMsg}
            </p>
          ) : null}
          {/* gap: om-cta-dark-gray forces margin:0 */}
          <div className="mt-2.5 flex flex-col gap-2">
            <div>
              <label className={cn(authLabelClass, "!mb-1 text-[11px]")}>
                OTP code
              </label>
              <input
                className={cn(authFieldClass, "h-9 text-[12px]")}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder={CUSTOMER_PHONE_OTP}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
            <button
              type="button"
              disabled={otpBusy || otp.length < 4}
              onClick={() => void confirmPhone()}
              className={cn(
                authPrimaryBtnClass,
                "!h-10 text-[13px] disabled:opacity-50",
              )}
              style={authPrimaryBtnStyle}
            >
              {otpBusy ? "Checking…" : "Verify phone"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
