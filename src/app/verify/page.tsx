"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { ApprovedView } from "@/components/verify/approved-view";
import { IdTierCard } from "@/components/verify/id-tier-card";
import { PhoneTierCard } from "@/components/verify/phone-tier-card";
import { useVerifyIdentity } from "@/components/verify/use-verify-identity";
import { useApp } from "@/lib/store";
import { defaultBackHref, navigateBack } from "@/lib/navigation";
import { TIER1_TRIAL_DAYS } from "@/lib/verification-gate";
import { cn } from "@/lib/utils";

/**
 * Customer verification (customers only)
 * Tier 1 Phone OTP (demo code 336699)
 * Tier 2 Country ID type + number + photo → admin/care review + approval
 */
export default function VerifyIdentityPage() {
  const router = useRouter();
  const { theme } = useApp();
  const isLight = theme === "light";
  const v = useVerifyIdentity();
  const { userProfile, accountType, pack, phoneOk, tier, daysLeft } = v;

  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-white/60";
  // Soft grey cards (not pure white) matches app shell
  const card = isLight ? "bg-[#d4d5d9]" : "bg-white/[0.06]";
  const shell = isLight ? "bg-[#c8c9cd]" : "bg-black";

  if (v.tier2Ok) {
    return (
      <ApprovedView
        shell={shell}
        ink={ink}
        muted={muted}
        onHome={() => router.replace("/")}
      />
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", shell)}>
      <div className="flex shrink-0 items-center gap-1.5 px-3 pb-1.5 pt-2.5">
        <button
          type="button"
          onClick={() =>
            navigateBack(router, defaultBackHref(accountType), accountType)
          }
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center border-0 bg-transparent",
            ink,
          )}
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className={cn("text-[15px] font-bold leading-tight", ink)}>
            Verification
          </h1>
          <p className={cn("text-[10px] font-medium leading-snug", muted)}>
            {tier} · {pack.countryName}
            {phoneOk && daysLeft < Infinity
              ? v.trialStarted
                ? ` · ${daysLeft} free day${daysLeft === 1 ? "" : "s"} left`
                : ` · ${TIER1_TRIAL_DAYS}-day free period from first request`
              : ""}
          </p>
        </div>
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#FF6B35]" />
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 pb-3 scrollbar-hide">
        {v.error ? (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-[11px] font-medium text-red-600">
            {v.error}
          </p>
        ) : null}

        <PhoneTierCard
          card={card}
          ink={ink}
          muted={muted}
          phoneOk={phoneOk}
          phone={userProfile?.phone}
          otp={v.otp}
          setOtp={v.setOtp}
          otpBusy={v.otpBusy}
          otpMsg={v.otpMsg}
          sendDemoOtp={v.sendDemoOtp}
          confirmPhone={v.confirmPhone}
        />

        <IdTierCard
          isLight={isLight}
          card={card}
          ink={ink}
          muted={muted}
          userProfile={userProfile}
          submitted={v.submitted}
          phoneOk={phoneOk}
          busy={v.busy}
          idTypes={v.idTypes}
          idType={v.idType}
          idNumber={v.idNumber}
          setIdNumber={v.setIdNumber}
          idFront={v.idFront}
          idFrontName={v.idFrontName}
          idBack={v.idBack}
          idBackName={v.idBackName}
          selectedDoc={v.selectedDoc}
          changeIdType={v.changeIdType}
          pickIdFront={v.pickIdFront}
          pickIdBack={v.pickIdBack}
          onPhotoReadError={v.onPhotoReadError}
          submitId={v.submitId}
        />
      </div>
    </div>
  );
}
