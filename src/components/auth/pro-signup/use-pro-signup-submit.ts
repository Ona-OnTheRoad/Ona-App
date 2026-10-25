import { checkIdentityAvailable } from "@/lib/account-registry";
import { verifySignupIds } from "@/lib/ng-id-verify-client";
import { clearSignupDraft } from "@/lib/signup-draft";
import type { UserProfile } from "@/lib/types";
import { buildProProfile } from "./build-pro-profile";
import type { ProSignupFlow } from "./use-pro-signup-flow";
import type { ProSignupForm } from "./use-pro-signup-form";
import type { SkillSelection } from "./use-skill-selection";
import type { VehicleFocus } from "./use-vehicle-focus";
import type { VehiclesCanFix } from "./use-vehicles-can-fix";
import type { BankDetailsValue } from "@/components/auth/bank-details-fields/types";
import { validateIdentity, validateStep5 } from "./validation";

const PASSWORD_REQUIRED = "password_required";
const MISSING_IDENTITY = "missing_identity";
export const PASSWORD_MISMATCH_MESSAGE =
  "That password doesn't match your Customer account";

type SubmitArgs = {
  form: ProSignupForm;
  flow: ProSignupFlow;
  skillSel: SkillSelection;
  focus: VehicleFocus;
  fix: VehiclesCanFix;
  /** step4Ok && step5Ok && step6Ok */
  stepsOk: boolean;
  userProfile: UserProfile | null;
  refCode: string | null;
  completeSignup: (
    profile: UserProfile,
    opts?: { onErrorCode?: (code: string) => void },
  ) => Promise<string | null | undefined>;
  replace: (href: string) => void;
  /** Wizard hook: return the user to the password step. */
  onPasswordRejected?: () => void;
  /** Wizard hook: take the user to the step that collects gender / date of birth. */
  onFixIdentity?: () => void;
};

/** Final "Finish and create account" action (identity checks → profile → signup). */
export function useProSignupSubmit({
  form,
  flow,
  skillSel,
  focus,
  fix,
  stepsOk,
  userProfile,
  refCode,
  completeSignup,
  replace,
  onPasswordRejected,
  onFixIdentity,
}: SubmitArgs) {
  const { busy, setBusy, setFormError, setStep, setDone } = flow;
  const { skill, specialty, skillAnswers } = skillSel;
  const { dualSignup, idNumber, bvn } = form;

  const finish = async (
    bankOverride?: BankDetailsValue,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (busy) return { ok: false };
    if (!skill || !specialty) {
      return { ok: false, error: "Please pick your trade and specialty." };
    }
    if (!stepsOk) {
      return { ok: false, error: "Please complete all required steps." };
    }
    const v5 = validateStep5(form);
    if (v5) {
      setFormError(v5);
      setStep(5);
      return { ok: false, error: v5 };
    }
    // Required by the server on every signup: ask in the wizard, never fail at the end.
    const identityMsg = validateIdentity(form);
    if (identityMsg) {
      setFormError(identityMsg);
      onFixIdentity?.();
      return { ok: false, error: identityMsg };
    }
    setBusy(true);
    setFormError("");

    // Dual role: same phone/email as Customer is intentional do not block
    if (!dualSignup) {
      const identity = checkIdentityAvailable({
        phone: form.fullPhone,
        email: form.email.trim(),
        nin: idNumber.trim(),
        bvn: bvn.trim(),
        accountType: "professional",
      });
      if (!identity.ok) {
        setFormError(identity.message);
        setBusy(false);
        setStep(5);
        return { ok: false, error: identity.message };
      }
    }

    const verified = await verifySignupIds({
      nin: idNumber.trim() || undefined,
      bvn: bvn.trim() || undefined,
      requireBoth: false,
    });
    if (!verified.ok) {
      setFormError(verified.message);
      setBusy(false);
      setStep(5);
      return { ok: false, error: verified.message };
    }

    const profile = buildProProfile({
      form,
      focus,
      fixList: fix.vehiclesCanFix,
      skill,
      specialty,
      skillAnswers,
      refCode: refCode || undefined,
    });

    if (bankOverride?.bankCode) {
      profile.bankCode = bankOverride.bankCode;
      profile.bankName = bankOverride.bankName;
      profile.bankAccountName = bankOverride.bankAccountName;
      profile.bankAccountNumber = bankOverride.bankAccountNumber;
    }

    // Dual-role: carry Customer bank into Repair Pro so payout bank is ready
    // and the "Add bank" panel does not ask again after signup.
    if (dualSignup && !profile.bankCode) {
      try {
        const { getVaultProfile } = await import("@/lib/profiles-vault");
        const { hasCompleteBankDetails } = await import("@/lib/bank-details");
        const vaultMot = getVaultProfile("motorist");
        const liveMot =
          userProfile?.accountType === "motorist" ? userProfile : null;
        const donor =
          (liveMot && hasCompleteBankDetails(liveMot) && liveMot) ||
          (vaultMot && hasCompleteBankDetails(vaultMot) && vaultMot) ||
          (userProfile && hasCompleteBankDetails(userProfile) && userProfile) ||
          null;
        if (donor) {
          profile.bankCode = donor.bankCode;
          profile.bankName = donor.bankName;
          profile.bankAccountName = donor.bankAccountName;
          profile.bankAccountNumber = donor.bankAccountNumber;
        }
      } catch {
        /* continue without bank; identity sync may still copy server-side */
      }
    }

    let errorCode: string | undefined;
    const err = await completeSignup(profile, {
      onErrorCode: (c) => {
        errorCode = c;
      },
    });
    if (err) {
      setBusy(false);
      // Wrong Customer password: send them back to the password step, keep steps 1-5.
      if (errorCode === MISSING_IDENTITY) {
        setFormError(err);
        onFixIdentity?.();
        return { ok: false, error: err };
      }
      if (errorCode === PASSWORD_REQUIRED) {
        form.setPassword("");
        form.setConfirmPassword("");
        setFormError(PASSWORD_MISMATCH_MESSAGE);
        onPasswordRejected?.();
        return { ok: false, error: PASSWORD_MISMATCH_MESSAGE };
      }
      replace(
        `/signup/error?role=professional&message=${encodeURIComponent(err)}`,
      );
      return { ok: false, error: err };
    }
    clearSignupDraft();
    setDone(true);
    setBusy(false);
    return { ok: true };
  };

  return { finish };
}
