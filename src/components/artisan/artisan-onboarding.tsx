"use client";

/**
 * Post-signup artisan onboarding (multi-step).
 * Phone OTP · Gov ID + NIN upload for admin/care review · liveness · skill proof.
 *
 * Thin composition file: state lives in hooks, each step in its own module
 * under ./artisan-onboarding/.
 */

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { tierProgressPercent } from "@/lib/artisan/status";
import { customerHasT1, customerHasT2 } from "@/lib/pro-switch-onboarding";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { STEPS } from "./artisan-onboarding/constants";
import { deriveViewFlags } from "./artisan-onboarding/derive-view-flags";
import { EmbedFooter } from "./artisan-onboarding/embed-footer";
import { FlashBanners } from "./artisan-onboarding/flash-banners";
import { EssentialsStep } from "./artisan-onboarding/essentials-step";
import { resolveOnboardingUserId } from "./artisan-onboarding/helpers";
import { OnboardingHeader } from "./artisan-onboarding/onboarding-header";
import { OptionalTiersStep } from "./artisan-onboarding/optional-tiers-step";
import { PhoneStep } from "./artisan-onboarding/phone-step";
import { PortfolioStep } from "./artisan-onboarding/portfolio-step";
import { ProfessionStep } from "./artisan-onboarding/profession-step";
import { ReviewStep } from "./artisan-onboarding/review-step";
import { StepFooter } from "./artisan-onboarding/step-footer";
import { buildOnboardingStyles } from "./artisan-onboarding/styles";
import type { ArtisanOnboardingProps } from "./artisan-onboarding/types";
import { govIdSubmitState } from "./artisan-onboarding/tier-labels";
import { TradeLockSheet } from "./artisan-onboarding/trade-lock-sheet";
import { TradeStep } from "./artisan-onboarding/trade-step";
import { useOnboardingActions } from "./artisan-onboarding/use-onboarding-actions";
import { useOnboardingState } from "./artisan-onboarding/use-onboarding-state";
import {
  useIdTypeMenuDismiss,
  useMandatoryComplete,
} from "./artisan-onboarding/use-onboarding-side-effects";
import { VerifiedScreen } from "./artisan-onboarding/verified-screen";
import { VideoStep } from "./artisan-onboarding/video-step";

export { useArtisanProfile } from "./artisan-onboarding/use-artisan-profile";

export function ArtisanOnboarding({
  mode = "full",
  embedInSheet = false,
  skipT1IfCustomerDone = false,
  skipT2IfCustomerDone = false,
  onMandatoryComplete,
  embedScrollParentRef,
  viewOnly = false,
}: ArtisanOnboardingProps) {
  const router = useRouter();
  const { backendUserId, displayName, userProfile, theme, updateUserProfile } =
    useApp();
  const styles = buildOnboardingStyles(theme === "light");
  const { sheetBg, ink, muted } = styles;
  const userId = resolveOnboardingUserId(backendUserId);

  const state = useOnboardingState({ mode, userId, displayName, userProfile });
  const { step, profile, patch } = state;
  const { otp, setOtp, otpSent, busy, setBusy, idBusy } = state;
  const { showLiveness, setShowLiveness, msg, setMsg } = state;
  const { err, setErr, toolDraft, setToolDraft, setTradeLockOpen } = state;
  const { gatePopup, setGatePopup, idTypeMenuOpen, setIdTypeMenuOpen } = state;

  const {
    stepIndex,
    goNext,
    goBack,
    sendOtp,
    verifyOtp,
    submitGovIdForReview,
    submitSkillForReview,
    submitNinForReview,
    submitReview,
  } = useOnboardingActions(state, updateUserProfile);
  const progress = profile ? tierProgressPercent(profile.tiers) : 0;

  // Hooks must run before any early return (Rules of Hooks)
  const hidePhoneTier = skipT1IfCustomerDone && customerHasT1(userProfile);
  const hideGovIdTiers = skipT2IfCustomerDone && customerHasT2(userProfile);

  useMandatoryComplete(onMandatoryComplete, userProfile, profile);
  useIdTypeMenuDismiss(idTypeMenuOpen, state.idTypeWrapRef, setIdTypeMenuOpen);

  if (!profile) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ backgroundColor: sheetBg }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  const {
    waitingCareId,
    needsResubmit,
    embedStep,
    showEmbedT2Form,
    showEmbedLivenessBtn,
    showEmbedBvnBtn,
    showEmbedSkillBtn,
  } = deriveViewFlags(profile, {
    embedInSheet,
    hidePhoneTier,
    hideGovIdTiers,
    showLiveness,
  });

  if (profile.status === "approved" && mode === "full") {
    return (
      <VerifiedScreen
        sheetBg={sheetBg}
        ink={ink}
        muted={muted}
        onDashboard={() => router.push("/dashboard")}
      />
    );
  }

  const { label: submitIdLabel, disabled: submitIdDisabled } = govIdSubmitState(
    profile,
    idBusy,
  );
  const base = { profile, patch, styles };
  const flash = { setErr, setMsg, setBusy };

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden",
        viewOnly && "select-none",
      )}
      style={{ backgroundColor: sheetBg }}
      data-view-only={viewOnly ? "1" : undefined}
    >
      <OnboardingHeader
        profile={profile}
        styles={styles}
        mode={mode}
        embedInSheet={embedInSheet}
        viewOnly={viewOnly}
        needsResubmit={needsResubmit}
        waitingCareId={waitingCareId}
        progress={progress}
        stepIndex={stepIndex}
      />

      {/* Body: one tier in sheet (panel-contained scroll only); full page scrolls freely */}
      <div
        ref={embedInSheet ? embedScrollParentRef : undefined}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3",
          embedInSheet ? "pb-2" : "pb-4",
          viewOnly && "pointer-events-none opacity-90",
        )}
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        }}
        data-pro-sheet-scroll={embedInSheet ? "1" : undefined}
      >
        <FlashBanners err={err} msg={msg} styles={styles} />

        {step === "trade" && (
          <TradeStep
            {...base}
            lockedPrimaryTrade={state.lockedPrimaryTrade}
            onTradeLocked={() => setTradeLockOpen(true)}
          />
        )}

        {step === "profession" && <ProfessionStep {...base} />}

        {/*PHONE TIER 1(skip if Customer already T1) */}
        {step === "phone" && !hidePhoneTier && (
          <PhoneStep
            {...base}
            otp={otp}
            otpSent={otpSent}
            setOtp={setOtp}
            sendOtp={sendOtp}
            verifyOtp={verifyOtp}
          />
        )}

        {step === "essentials" && (
          <EssentialsStep
            {...base}
            toolDraft={toolDraft}
            setToolDraft={setToolDraft}
          />
        )}

        {step === "portfolio" && <PortfolioStep {...base} {...flash} />}

        {step === "video" && <VideoStep {...base} {...flash} />}

        {/*OPTIONAL TIERS 2-4 (strict order)*/}
        {(step === "optional_tiers" || mode === "settings") && (
          <OptionalTiersStep
            {...base}
            {...flash}
            embedInSheet={embedInSheet}
            embedStep={embedStep}
            hideGovIdTiers={hideGovIdTiers}
            busy={busy}
            idBusy={idBusy}
            otp={otp}
            otpSent={otpSent}
            setOtp={setOtp}
            sendOtp={sendOtp}
            verifyOtp={verifyOtp}
            gatePopup={gatePopup}
            setGatePopup={setGatePopup}
            showLiveness={showLiveness}
            setShowLiveness={setShowLiveness}
            idTypeWrapRef={state.idTypeWrapRef}
            idTypeMenuOpen={idTypeMenuOpen}
            setIdTypeMenuOpen={setIdTypeMenuOpen}
            skillSectionRef={state.skillSectionRef}
            submitIdLabel={submitIdLabel}
            submitIdDisabled={submitIdDisabled}
            submitGovIdForReview={submitGovIdForReview}
            submitNinForReview={submitNinForReview}
            submitSkillForReview={submitSkillForReview}
            backendUserId={backendUserId}
            userProfile={userProfile}
          />
        )}

        {step === "review" && (
          <ReviewStep
            profile={profile}
            styles={styles}
            busy={busy}
            submitReview={submitReview}
          />
        )}
      </div>

      {mode === "full" ? (
        <TradeLockSheet
          open={state.tradeLockOpen}
          onClose={() => setTradeLockOpen(false)}
          ink={ink}
          muted={muted}
        />
      ) : null}

      {showEmbedT2Form ||
      showEmbedLivenessBtn ||
      showEmbedBvnBtn ||
      showEmbedSkillBtn ? (
        <EmbedFooter
          profile={profile}
          sheetBg={sheetBg}
          viewOnly={viewOnly}
          busy={busy}
          idBusy={idBusy}
          showT2Form={showEmbedT2Form}
          showLivenessBtn={showEmbedLivenessBtn}
          showBvnBtn={showEmbedBvnBtn}
          showSkillBtn={showEmbedSkillBtn}
          submitIdLabel={submitIdLabel}
          submitIdDisabled={submitIdDisabled}
          submitGovIdForReview={submitGovIdForReview}
          submitNinForReview={submitNinForReview}
          submitSkillForReview={submitSkillForReview}
          onStartLiveness={() => {
            setShowLiveness(true);
            setErr(null);
          }}
        />
      ) : null}

      {mode === "full" ? (
        <StepFooter
          sheetBg={sheetBg}
          navBack={styles.navBack}
          canContinue={stepIndex < STEPS.length - 1}
          canGoBack={stepIndex > 0}
          onContinue={goNext}
          onBack={goBack}
        />
      ) : null}
    </div>
  );
}
