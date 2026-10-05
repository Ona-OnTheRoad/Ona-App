import { Check, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { OtpControls, PhoneNumberField } from "./phone-otp-controls";
import type { StepBaseProps } from "./types";

type Props = StepBaseProps & {
  otp: string;
  otpSent: boolean;
  setOtp: (v: string) => void;
  sendOtp: () => Promise<void>;
  verifyOtp: () => Promise<void>;
};

/** Step 3: Tier 1 phone OTP */
export function PhoneStep({
  profile,
  patch,
  styles,
  otp,
  otpSent,
  setOtp,
  sendOtp,
  verifyOtp,
}: Props) {
  const { ink, soft, tipBox, fieldClass, isLight } = styles;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Phone className="h-5 w-5 text-[#FF6B35]" />
        <h2 className={cn("text-[15px] font-bold", ink)}>Phone verification</h2>
      </div>
      <div
        className={cn(
          "rounded-md px-3 py-2.5 text-[11px] font-medium leading-snug",
          tipBox,
        )}
      >
        <p className="font-bold">Tier 1 required</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4">
          <li>Enter your phone and send a code</li>
          <li>Code expires in 10 minutes (5 tries, 45s resend)</li>
          <li>Enter the code to verify</li>
        </ol>
      </div>
      <PhoneNumberField
        profile={profile}
        patch={patch}
        soft={soft}
        fieldClass={fieldClass}
      />
      {!profile.tiers.tier1_phone ? (
        <OtpControls
          otp={otp}
          otpSent={otpSent}
          setOtp={setOtp}
          onSend={() => void sendOtp()}
          onVerify={() => void verifyOtp()}
          fieldClass={fieldClass}
        />
      ) : (
        <p
          className={cn(
            "flex items-center gap-2 text-[13px] font-bold",
            isLight ? "text-emerald-700" : "text-emerald-400",
          )}
        >
          <Check className="h-4 w-4" /> Phone verified (Tier 1)
        </p>
      )}
    </section>
  );
}
