"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Tier1PhoneCard } from "./tier1-phone-card";
import { Tier2GovernmentIdCard } from "./tier2-government-id-card";
import { Tier3LivenessCard } from "./tier3-liveness-card";
import { Tier4SkillCard } from "./tier4-skill-card";
import { Tier2ApprovedView } from "./tier2-approved-view";
import { useVerifyIdentity } from "./use-verify-identity";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";

interface VerificationScreenProps {
  isLight?: boolean;
}

export function VerificationScreen({ isLight: propIsLight }: VerificationScreenProps) {
  const router = useRouter();
  const { theme, accountType } = useApp();
  const isLight = propIsLight ?? theme === "light";
  const v = useVerifyIdentity();
  const isPro = (v.accountType || accountType) === "professional";

  const profileRecord = v.userProfile as unknown as Record<string, unknown> | null;
  const isTier4Submitted = Boolean(
    profileRecord?.skillProof || profileRecord?.tier4Status === "under_review" || profileRecord?.skillProofStatus === "under_review",
  );

  // Customer celebration view when Tier 2 is approved (Image 1 Screen 4)
  if (!isPro && v.tier2Ok) {
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
            isPro={isPro}
          />

          {/* Card 2: Tier 2 Government ID Card */}
          <Tier2GovernmentIdCard
            isLight={isLight}
            phoneOk={v.phoneOk}
            submitted={v.submitted}
            tier2Ok={v.tier2Ok}
            onClick={() => router.push("/verify/tier-2")}
            isPro={isPro}
          />

          {/* Tier 3 & Tier 4 rendered ONLY for Repair Pro (Image 2 Screen 1) */}
          {isPro && (
            <>
              {/* Card 3: Tier 3 Face Liveness Verification */}
              <Tier3LivenessCard
                isLight={isLight}
                isUnlocked={v.tier2Ok}
                isVerified={Boolean(profileRecord?.livenessVerified)}
                onClick={() => router.push("/settings/security")}
              />

              {/* Card 4: Tier 4 Trade / Skill Certification proof */}
              <Tier4SkillCard
                isLight={isLight}
                status={isTier4Submitted ? "under_review" : "locked"}
                onClick={() => router.push("/verify/tier-4")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
