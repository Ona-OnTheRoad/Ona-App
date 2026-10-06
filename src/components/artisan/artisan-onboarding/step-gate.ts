import { professionAnswersValid } from "@/lib/artisan/profession-questions";
import type {
  ArtisanOnboardingStep,
  ArtisanVerificationProfile,
} from "@/lib/artisan/types";
import { PORTFOLIO_MIN } from "@/lib/artisan/types";

/** Block Next until step requirements are met */
export function stepGateError(
  profile: ArtisanVerificationProfile | null,
  step: ArtisanOnboardingStep,
): string | null {
  if (!profile) return "Loading…";
  if (step === "trade") {
    if (!profile.trade.service) return "Select your primary trade";
    if (!profile.trade.specialty?.trim()) return "Select a specialty";
    return null;
  }
  if (step === "profession") {
    if (
      !professionAnswersValid(
        profile.trade.service,
        profile.professionAnswers || {},
      )
    ) {
      return "Answer all required questions (include text if you pick Other)";
    }
    return null;
  }
  if (step === "phone") {
    if (!profile.tiers.tier1_phone) return "Verify your phone to continue";
    return null;
  }
  if (step === "essentials") {
    if (!profile.yearsExperience || profile.yearsExperience < 1) {
      return "Enter years of experience";
    }
    if (!profile.serviceArea.states?.length) return "Pick your service state";
    if (!profile.serviceArea.cities?.length) {
      return "Pick at least one city";
    }
    if (!profile.toolsOwned?.length) return "Add at least one tool";
    if (
      !profile.guarantor.fullName?.trim() ||
      !profile.guarantor.phone?.trim()
    ) {
      return "Guarantor name and phone are required";
    }
    return null;
  }
  if (step === "portfolio") {
    if (profile.portfolio.length < PORTFOLIO_MIN) {
      return `Upload at least ${PORTFOLIO_MIN} photos`;
    }
    return null;
  }
  return null;
}
