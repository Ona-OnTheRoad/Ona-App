import type { ReactNode, RefObject } from "react";
import { Phone } from "lucide-react";
import type { ProEmbedTierStep } from "@/lib/artisan/verification-order";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BvnTier } from "./bvn-tier";
import { GatePopup } from "./gate-popup";
import { GovIdTier } from "./gov-id-tier";
import { LivenessTier } from "./liveness-tier";
import { OtpControls, PhoneNumberField } from "./phone-otp-controls";
import { SkillTier } from "./skill-tier";
import { EmbedTierHeader, TierOrderIntro } from "./tiers-intro";
import type { FlashSetters, StepBaseProps } from "./types";

type Props = StepBaseProps &
  FlashSetters & {
    embedInSheet: boolean;
    embedStep: ProEmbedTierStep | null;
    hideGovIdTiers: boolean;
    busy: boolean;
    idBusy: "gov" | "nin" | null;
    otp: string;
    otpSent: boolean;
    setOtp: (v: string) => void;
    sendOtp: () => Promise<void>;
    verifyOtp: () => Promise<void>;
    gatePopup: string | null;
    setGatePopup: (message: string | null) => void;
    showLiveness: boolean;
    setShowLiveness: (show: boolean) => void;
    idTypeWrapRef: RefObject<HTMLDivElement | null>;
    idTypeMenuOpen: boolean;
    setIdTypeMenuOpen: (next: boolean | ((o: boolean) => boolean)) => void;
    skillSectionRef: RefObject<HTMLDivElement | null>;
    submitIdLabel: ReactNode;
    submitIdDisabled: boolean;
    submitGovIdForReview: () => Promise<void>;
    submitNinForReview: () => Promise<void>;
    submitSkillForReview: () => Promise<void>;
    backendUserId: string | null;
    userProfile: UserProfile | null;
  };

/** Optional tiers 2-4 (strict order). Sheet embed shows one tier at a time. */
export function OptionalTiersStep(props: Props) {
  const {
    profile,
    patch,
    styles,
    embedInSheet,
    embedStep,
    hideGovIdTiers,
    otp,
    otpSent,
    setOtp,
    sendOtp,
    verifyOtp,
    gatePopup,
    setGatePopup,
  } = props;
  const { ink, soft, tipBox, fieldClass, isLight } = styles;
  return (
    <section className={cn(embedInSheet ? "space-y-3" : "space-y-4")}>
      {/* Lower panel: one tier only. Full page: full order list. */}
      {embedInSheet ? (
        <EmbedTierHeader embedStep={embedStep} tipBox={tipBox} />
      ) : (
        <TierOrderIntro profile={profile} tipBox={tipBox} isLight={isLight} />
      )}

      {/* Soft grey square lock popup */}
      {gatePopup ? (
        <GatePopup
          message={gatePopup}
          isLight={isLight}
          onClose={() => setGatePopup(null)}
        />
      ) : null}

      {/* Sheet embed: phone only when active step */}
      {embedInSheet && embedStep === "phone" ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-[#FF6B35]" />
            <p className={cn("text-[13px] font-bold", ink)}>
              Phone verification
            </p>
          </div>
          <PhoneNumberField
            profile={profile}
            patch={patch}
            soft={soft}
            fieldClass={fieldClass}
          />
          <OtpControls
            otp={otp}
            otpSent={otpSent}
            setOtp={setOtp}
            onSend={() => void sendOtp()}
            onVerify={() => void verifyOtp()}
            fieldClass={fieldClass}
          />
        </div>
      ) : null}

      {hideGovIdTiers && (!embedInSheet || embedStep === "gov_id") ? (
        <div
          className={cn(
            "rounded-md px-3 py-2.5 text-[11px] font-medium leading-snug",
            isLight
              ? "bg-emerald-100 text-emerald-900"
              : "bg-emerald-950/40 text-emerald-200",
          )}
        >
          <p className="font-bold">Tier 2 already complete</p>
          <p className="mt-0.5">
            Your Customer government ID is verified: no re-upload for Repair
            Pro.
          </p>
        </div>
      ) : null}

      {/* T2 Government ID sheet: only when this is the active tier */}
      <GovIdTier
        profile={profile}
        patch={patch}
        styles={styles}
        setErr={props.setErr}
        setBusy={props.setBusy}
        hidden={hideGovIdTiers || (embedInSheet && embedStep !== "gov_id")}
        embedInSheet={embedInSheet}
        idTypeWrapRef={props.idTypeWrapRef}
        idTypeMenuOpen={props.idTypeMenuOpen}
        setIdTypeMenuOpen={props.setIdTypeMenuOpen}
        submitIdLabel={props.submitIdLabel}
        submitIdDisabled={props.submitIdDisabled}
        submitGovIdForReview={props.submitGovIdForReview}
      />

      {/* T3-T4: full page shows all; sheet shows active tier only */}
      {(!embedInSheet ||
        embedStep === "liveness" ||
        embedStep === "bvn" ||
        embedStep === "skill") && (
        <>
          <LivenessTier
            profile={profile}
            patch={patch}
            styles={styles}
            setErr={props.setErr}
            setMsg={props.setMsg}
            hidden={!(!embedInSheet || embedStep === "liveness")}
            embedInSheet={embedInSheet}
            showLiveness={props.showLiveness}
            setShowLiveness={props.setShowLiveness}
            setGatePopup={setGatePopup}
            backendUserId={props.backendUserId}
            userProfile={props.userProfile}
          />
          <BvnTier
            profile={profile}
            patch={patch}
            styles={styles}
            hidden={!(!embedInSheet || embedStep === "bvn")}
            embedInSheet={embedInSheet}
            idBusy={props.idBusy}
            setGatePopup={setGatePopup}
            submitNinForReview={props.submitNinForReview}
          />
          <SkillTier
            profile={profile}
            patch={patch}
            styles={styles}
            setErr={props.setErr}
            setMsg={props.setMsg}
            setBusy={props.setBusy}
            hidden={!(!embedInSheet || embedStep === "skill")}
            embedInSheet={embedInSheet}
            busy={props.busy}
            skillSectionRef={props.skillSectionRef}
            setGatePopup={setGatePopup}
            submitSkillForReview={props.submitSkillForReview}
          />
        </>
      )}
    </section>
  );
}
