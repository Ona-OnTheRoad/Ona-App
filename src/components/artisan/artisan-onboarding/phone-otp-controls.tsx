import { cn } from "@/lib/utils";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import type { PatchProfile } from "./types";

/** Phone number field (editing a verified number resets Tier 1) */
export function PhoneNumberField({
  profile,
  patch,
  soft,
  fieldClass,
}: {
  profile: ArtisanVerificationProfile;
  patch: PatchProfile;
  soft: string;
  fieldClass: string;
}) {
  return (
    <label className={cn("block text-[11px] font-bold", soft)}>
      Phone number
      <input
        value={profile.phone}
        onChange={(e) =>
          patch({
            phone: e.target.value,
            ...(profile.tiers.tier1_phone
              ? { tiers: { ...profile.tiers, tier1_phone: false } }
              : {}),
          })
        }
        className={cn("mt-1", fieldClass)}
        placeholder="+234 801 234 5678"
        inputMode="tel"
      />
    </label>
  );
}

/** Send / resend OTP button + 6-digit code entry */
export function OtpControls({
  otp,
  otpSent,
  setOtp,
  onSend,
  onVerify,
  fieldClass,
}: {
  otp: string;
  otpSent: boolean;
  setOtp: (v: string) => void;
  onSend: () => void;
  onVerify: () => void;
  fieldClass: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onSend}
        className="h-10 w-full rounded-md border-0 bg-[#323231] text-[13px] font-bold text-white"
      >
        {otpSent ? "Resend OTP" : "Send OTP"}
      </button>
      {/* Demo / SMS-config codes are never shown in the UI */}
      {otpSent ? (
        <div className="flex gap-2">
          <input
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className={cn(
              "min-w-0 flex-1 font-bold tracking-widest",
              fieldClass,
            )}
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
          />
          <button
            type="button"
            onClick={onVerify}
            disabled={otp.length !== 6}
            className="h-10 shrink-0 rounded-md border-0 bg-[#FF6B35] px-4 text-[13px] font-bold text-white disabled:opacity-50"
          >
            Verify
          </button>
        </div>
      ) : null}
    </>
  );
}
