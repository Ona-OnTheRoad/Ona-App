import { STEPS } from "./constants";
import { stepGateError } from "./step-gate";
import type { OnboardingState } from "./use-onboarding-state";
import { useOtpActions } from "./use-otp-actions";
import { useVerifyActions } from "./use-verify-actions";

/** Wizard navigation + OTP + submit-for-review actions over the shared state */
export function useOnboardingActions(
  state: OnboardingState,
  updateUserProfile: (partial: { phoneVerified: boolean }) => void,
) {
  const { step, setStep, profile, setErr } = state;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const goNext = () => {
    const gate = stepGateError(profile, step);
    if (gate) {
      setErr(gate);
      return;
    }
    setErr(null);
    setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)].id);
  };

  const goBack = () => setStep(STEPS[Math.max(0, stepIndex - 1)].id);

  const otpActions = useOtpActions({
    profile,
    otp: state.otp,
    patch: state.patch,
    setOtp: state.setOtp,
    setOtpSent: state.setOtpSent,
    setMsg: state.setMsg,
    setErr,
    updateUserProfile,
  });
  const verifyActions = useVerifyActions({
    profile,
    patch: state.patch,
    setProfile: state.setProfile,
    setBusy: state.setBusy,
    setIdBusy: state.setIdBusy,
    setMsg: state.setMsg,
    setErr,
    setGatePopup: state.setGatePopup,
  });

  return { stepIndex, goNext, goBack, ...otpActions, ...verifyActions };
}
