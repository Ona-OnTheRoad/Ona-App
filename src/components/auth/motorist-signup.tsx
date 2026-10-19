"use client";

import { RegistrationComplete } from "@/components/auth/registration-complete";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { OnaStepBars } from "@/components/ui/ona-step-bars";
import { SignupFooter } from "./motorist-signup/signup-footer";
import { StepArea } from "./motorist-signup/step-area";
import { StepPassword } from "./motorist-signup/step-password";
import { StepVehicles } from "./motorist-signup/step-vehicles";
import {
  STEP_SUBTITLES as subtitles,
  STEP_TITLES as titles,
} from "./motorist-signup/types";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { useMotoristSignup } from "./motorist-signup/use-motorist-signup";

export function MotoristSignup() {
  const {
    exiting,
    router,
    step,
    done,
    busy,
    formError,
    fields,
    vehicleState,
    dualPasswordOk,
    goBack,
    goNext,
    finish,
  } = useMotoristSignup();
  useFeedbackToast("", formError);

  return (
    <>
      <OnaScreen
        wordmark
        exiting={exiting}
        onBack={goBack}
        footer={
          <SignupFooter
            step={step}
            busy={busy}
            hasVehicles={vehicleState.vehicles.length > 0}
            onNext={goNext}
            onFinish={finish}
          />
        }
      >
        <div className="mb-5">
          <OnaStepBars current={step} total={3} />
        </div>
        <OnaTitle title={titles[step]} subtitle={subtitles[step]} />
        <div className="mt-5">
          {step === 1 && (
            <StepPassword f={fields} dualPasswordOk={dualPasswordOk} />
          )}
          {step === 2 && (
            <StepArea
              city={fields.city}
              setCity={fields.setCity}
              area={fields.area}
              setArea={fields.setArea}
            />
          )}
          {step === 3 && <StepVehicles v={vehicleState} />}
        </div>
      </OnaScreen>

      <RegistrationComplete
        open={done}
        accountLabel="Customer"
        onContinue={() => {
          // Customer home map lower panel opens collapsed
          router.replace("/");
        }}
      />
    </>
  );
}
