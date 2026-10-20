"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Tier1PhoneCard } from "./tier1-phone-card";
import { Tier2GovernmentIdCard } from "./tier2-government-id-card";
import { Tier2ApprovedView } from "./tier2-approved-view";
import { useVerifyIdentity } from "./use-verify-identity";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";

interface VerificationScreenProps {
  isLight?: boolean;
}

export function VerificationScreen({ isLight: propIsLight }: VerificationScreenProps) {
  const router = useRouter();
  const { theme } = useApp();
  const isLight = propIsLight ?? theme === "light";
  const v = useVerifyIdentity();

  // If approved for Tier 2, show Screen 3 (Approved View)
  if (v.tier2Ok) {
    return <Tier2ApprovedView isLight={isLight} />;
  }

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20">
        {/* Top Back bar */}
        <div className="flex items-center pt-3 pb-1 mb-2">
          <button
            type="button"
            onClick={() => navigateBack(router, "/profile", v.accountType)}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 active:opacity-70"
            aria-label="Back to Profile"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Screen Title */}
        <h1 className="text-[20px] font-semibold tracking-tight mb-6 text-ona-ink">
          Verification
        </h1>

        {/* Vertical Stack of Tier Cards */}
        <div className="space-y-4">
          {/* Card 1: Tier 1 Phone Verification */}
          <Tier1PhoneCard
            isLight={isLight}
            phoneOk={v.phoneOk}
            phone={v.userProfile?.phone}
            otp={v.otp}
            setOtp={v.setOtp}
            otpBusy={v.otpBusy}
            otpMsg={v.otpMsg}
            sendDemoOtp={v.sendDemoOtp}
            confirmPhone={v.confirmPhone}
          />

          {/* Card 2: Tier 2 Government ID Card (Clickable to /verify/tier-2 if past Tier 1) */}
          <Tier2GovernmentIdCard
            isLight={isLight}
            phoneOk={v.phoneOk}
            submitted={v.submitted}
            tier2Ok={v.tier2Ok}
            onClick={() => router.push("/verify/tier-2")}
          />
        </div>
      </div>
    </div>
  );
}
