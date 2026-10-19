"use client";

import { RegistrationComplete } from "@/components/auth/registration-complete";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { OnaStepBars } from "@/components/ui/ona-step-bars";
import { SignupFooter } from "./motorist-signup/signup-footer";
import { StepArea } from "./motorist-signup/step-area";
import { StepDetails } from "./motorist-signup/step-details";
import { StepPassword } from "./motorist-signup/step-password";
import { StepVehicles } from "./motorist-signup/step-vehicles";
import {
  STEP_SUBTITLES as subtitles,
  STEP_TITLES as titles,
} from "./motorist-signup/types";
import { useMotoristSignup } from "./motorist-signup/use-motorist-signup";

export function MotoristSignup() {
  const {
    exiting,
    go,
    router,
    step,
    done,
    busy,
    formError,
    fields,
    vehicleState,
    dualPasswordOk,
    urlRef,
    refInput,
    setRefInput,
    goBack,
    goNext,
    finish,
  } = useMotoristSignup();

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
            onLogin={() => go("/login/signin")}
          />
        }
      >
        {step > 1 ? (
          <div className="mb-5">
            <OnaStepBars current={step - 1} total={3} />
          </div>
        ) : null}
        <OnaTitle title={titles[step]} subtitle={subtitles[step]} />
        <div className="mt-5">
          {step === 1 && (
            <StepDetails
              f={fields}
              urlRef={urlRef}
              refInput={refInput}
              setRefInput={setRefInput}
            />
          )}
          {step === 2 && (
            <StepPassword f={fields} dualPasswordOk={dualPasswordOk} />
          )}
          {step === 3 && (
            <StepArea
              city={fields.city}
              setCity={fields.setCity}
              area={fields.area}
              setArea={fields.setArea}
            />
          )}
          {step === 4 && <StepVehicles v={vehicleState} />}
          {formError ? (
            <p
              role="alert"
              className="mt-4 rounded-ona-ctl bg-ona-brand-soft px-3 py-2 text-[12px] font-medium leading-snug text-ona-danger"
            >
              {formError}
            </p>
          ) : null}
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
