"use client";

import { ChevronLeft } from "lucide-react";
import { AuthPlate } from "@/components/auth/auth-plate";
import { RegistrationComplete } from "@/components/auth/registration-complete";
import { cn } from "@/lib/utils";
import { SignupFooter } from "./motorist-signup/signup-footer";
import { StepAccount } from "./motorist-signup/step-account";
import { StepArea } from "./motorist-signup/step-area";
import { StepVehicles } from "./motorist-signup/step-vehicles";
import {
  STEP_SUBTITLES as subtitles,
  STEP_TITLES as titles,
  type Step,
} from "./motorist-signup/types";
import { useMotoristSignup } from "./motorist-signup/use-motorist-signup";

export function MotoristSignup() {
  const {
    exiting,
    router,
    step,
    done,
    busy,
    formError,
    setFormError,
    fields,
    vehicleState,
    dualPasswordOk,
    step1Ok,
    step2Ok,
    goBack,
    goNext,
    finish,
  } = useMotoristSignup();

  return (
    <AuthPlate exiting={exiting}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top bar full width for chrome */}
        <div className="mx-auto flex w-[80%] shrink-0 items-center pb-0.5 pt-2.5">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-8 items-center gap-0.5 rounded-md border-0 bg-transparent px-0 text-[12px] font-semibold text-[#1e293b] transition-opacity active:opacity-70"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
            Back
          </button>
        </div>

        {/* Header */}
        <div className="mx-auto w-[80%] shrink-0 pt-1 text-center">
          <h1 className="text-[18px] font-bold leading-tight tracking-tight text-[#0f172a]">
            {titles[step]}
          </h1>
          <p className="mx-auto mt-0.5 text-[11px] leading-snug text-[#475569]">
            {subtitles[step]}
          </p>
        </div>

        {/* Progress bar only (no page numbers) */}
        <div className="mx-auto mt-2 flex w-[80%] shrink-0 gap-1">
          {([1, 2, 3] as Step[]).map((n) => (
            <span
              key={n}
              className={cn(
                "h-0.5 flex-1 rounded-sm transition-colors",
                n <= step ? "bg-[#FF6B35]" : "bg-black/10",
              )}
            />
          ))}
        </div>

        {/* Body 80% width, stacked fields */}
        <div
          className={cn(
            "mx-auto mt-2 flex min-h-0 w-[80%] flex-1 flex-col pb-1",
            step === 1 ? "overflow-hidden" : "overflow-y-auto scrollbar-hide",
          )}
        >
          {step === 1 && (
            <StepAccount
              f={fields}
              formError={formError}
              dualPasswordOk={dualPasswordOk}
            />
          )}

          {step === 2 && (
            <StepArea
              city={fields.city}
              setCity={fields.setCity}
              area={fields.area}
              setArea={fields.setArea}
            />
          )}

          {step === 3 && (
            <StepVehicles v={vehicleState} setFormError={setFormError} />
          )}
        </div>

        {/* Footer dark gray #323231 matching "Continue to sign up" */}
        <SignupFooter
          step={step}
          step1Ok={step1Ok}
          step2Ok={step2Ok}
          busy={busy}
          onNext={goNext}
          onFinish={finish}
        />
      </div>

      <RegistrationComplete
        open={done}
        accountLabel="Customer"
        onContinue={() => {
          // Customer home map lower panel opens collapsed
          router.replace("/");
        }}
      />
    </AuthPlate>
  );
}
