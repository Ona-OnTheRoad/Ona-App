"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Info } from "lucide-react";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { maskPhone } from "@/components/auth/sign-in-form/phone-input";
import { Button } from "@/components/ui/button";
import { OnaOtpInput } from "@/components/ui/ona-otp-input";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { formatInternationalPhone } from "@/lib/phone-codes";
import {
  loadSignupDraft,
  signupHref,
  type SignupDraft,
} from "@/lib/signup-draft";

/**
 * "Verify your number". The backend cannot verify a number before an account
 * exists and SMS billing is not live, so the boxes are disabled and the step is
 * skippable (docs/DESIGN_GAPS.md). Nothing is sent or verified here.
 */
export function SignupVerify() {
  const router = useRouter();
  const { exiting, go } = useAuthNavigate();
  const ref = useSearchParams().get("ref");
  const [draft, setDraft] = useState<SignupDraft | null>(null);

  useEffect(() => {
    const d = loadSignupDraft();
    if (!d) {
      router.replace(signupHref("/signup", { ref }));
      return;
    }
    setDraft(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!draft) return <div className="ona2 h-full" aria-busy="true" />;

  const phone = maskPhone(
    formatInternationalPhone(draft.phoneDial, draft.phoneNational),
  );
  return (
    <OnaScreen
      wordmark
      exiting={exiting}
      onBack={() => go(signupHref("/signup", { ref }))}
      footer={
        <Button
          size="ona"
          variant="ona"
          onClick={() => go(signupHref("/login/role", { ref }))}
        >
          Skip for now
        </Button>
      }
    >
      <OnaTitle
        title="Verify your number"
        subtitle={`Enter the 6-digit verification code sent to ${phone}`}
      />
      <div className="mt-6 flex flex-col gap-4">
        <OnaOtpInput value="" onChange={() => {}} disabled label="SMS code" />
        <p
          className="flex gap-2 rounded-ona-ctl bg-ona-field px-3 py-2.5 text-[12px] leading-snug text-ona-muted"
          role="note"
        >
          <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Phone verification isn&apos;t available yet. You can verify your
          number later from your profile.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            disabled
            className="flex min-h-[44px] items-center border-0 bg-transparent text-[13px] font-medium text-ona-muted"
          >
            Resend code
          </button>
        </div>
      </div>
    </OnaScreen>
  );
}
