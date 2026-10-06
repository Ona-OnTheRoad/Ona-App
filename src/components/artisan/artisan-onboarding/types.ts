import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";

/** Theme tokens + shared class strings used across onboarding steps */
export type OnboardingStyles = {
  isLight: boolean;
  sheetBg: string;
  ink: string;
  muted: string;
  soft: string;
  fieldClass: string;
  selectClass: string;
  panelClass: string;
  chipOff: string;
  chipOn: string;
  uploadClass: string;
  errBox: string;
  msgBox: string;
  warnBox: string;
  tipBox: string;
  navBack: string;
  tradeOff: string;
};

export type PatchProfile = (
  partial: Partial<ArtisanVerificationProfile>,
) => void;

/** Props every profile-editing step receives */
export type StepBaseProps = {
  profile: ArtisanVerificationProfile;
  patch: PatchProfile;
  styles: OnboardingStyles;
};

/** Banner + busy setters shared by upload/submit handlers */
export type FlashSetters = {
  setErr: Dispatch<SetStateAction<string | null>>;
  setMsg: Dispatch<SetStateAction<string | null>>;
  setBusy: Dispatch<SetStateAction<boolean>>;
};

export type ArtisanOnboardingProps = {
  /** full = post-signup; settings = optional tiers later */
  mode?: "full" | "settings";
  /** Nested in ProOnboardingSheet (60% panel) compact chrome */
  embedInSheet?: boolean;
  /** Customer already passed T1 hide phone OTP step */
  skipT1IfCustomerDone?: boolean;
  /** Customer already passed T2 hide gov ID re-verify */
  skipT2IfCustomerDone?: boolean;
  /** Called when mandatory T1+T2 (inherited or done) are satisfied */
  onMandatoryComplete?: () => void;
  /** Sheet swipe: scroll container for “at top → collapse” */
  embedScrollParentRef?: RefObject<HTMLDivElement | null>;
  /** Settings “View Verification” no edits */
  viewOnly?: boolean;
};
