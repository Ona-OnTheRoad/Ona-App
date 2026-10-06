"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { RegistrationComplete } from "@/components/auth/registration-complete";
import {
  AppleProBody,
  AppleProFooter,
  AppleProProgress,
  AppleProTitle,
  AppleProWizard,
} from "@/components/pro/apple-pro-wizard";
import { needsVehiclesSignupStep } from "@/lib/artisan/catalog";
import { getPhoneCodeOptions } from "@/lib/phone-codes";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FLOW_STEPS, type Step } from "./pro-signup/constants";
import { proFieldStyles } from "./pro-signup/field-styles";
import { PrefPicker } from "./pro-signup/pref-picker";
import { StepAbout } from "./pro-signup/step-about";
import { StepArea } from "./pro-signup/step-area";
import { StepContact } from "./pro-signup/step-contact";
import { StepReview } from "./pro-signup/step-review";
import { StepSpecialty } from "./pro-signup/step-specialty";
import { StepTrade } from "./pro-signup/step-trade";
import { StepVehicles } from "./pro-signup/step-vehicles";
import { useProSignupFlow } from "./pro-signup/use-pro-signup-flow";
import { useProSignupForm } from "./pro-signup/use-pro-signup-form";
import { useProSignupNav } from "./pro-signup/use-pro-signup-nav";
import { useProSignupSubmit } from "./pro-signup/use-pro-signup-submit";
import { useSkillSelection } from "./pro-signup/use-skill-selection";
import { useVehicleFocus } from "./pro-signup/use-vehicle-focus";
import { useVehiclesCanFix } from "./pro-signup/use-vehicles-can-fix";
import { VehicleCascadePicker } from "./pro-signup/vehicle-cascade-picker";
import { isStep4Ok, isStep5Ok, isStep6Ok } from "./pro-signup/validation";

/**
 * Full Repair Pro registration one skill only, skill-specific questions,
 * unique phone/email/NIN/BVN across all accounts.
 */
export function ProSignup() {
  const router = useRouter();
  const { exiting, go } = useAuthNavigate();
  const searchParams = useSearchParams();
  const { completeSignup, userProfile, isAuthenticated, theme } = useApp();
  const isLight = theme === "light";
  const styles = proFieldStyles(isLight);
  const phoneCodes = useMemo(() => getPhoneCodeOptions(), []);
  const flow = useProSignupFlow();
  const { step, done, busy, formError } = flow;
  /** After signup → artisan verification onboarding (Go Live gated until approved) */
  const fromMenu = searchParams.get("from") === "menu";
  const fromProfile = searchParams.get("from") === "profile";

  const skillSel = useSkillSelection();
  const { skill, specialty } = skillSel;
  const form = useProSignupForm({
    userProfile,
    isAuthenticated,
    fromMenu,
    fromProfile,
  });
  const focus = useVehicleFocus();
  const fix = useVehiclesCanFix();

  /** Auto trades + AC/Electric (Vehicle focus) only solar/generator skip */
  const needsVehicleStep = needsVehiclesSignupStep(skill, specialty);
  const step4Ok = isStep4Ok(form);
  const step5Ok = isStep5Ok(form);
  const step6Ok = isStep6Ok(form);

  const { finish } = useProSignupSubmit({
    form,
    flow,
    skillSel,
    focus,
    fix,
    stepsOk: step4Ok && step5Ok && step6Ok,
    userProfile,
    refCode: searchParams.get("ref"),
    completeSignup,
    replace: (href) => router.replace(href),
  });

  const { goBack, onNext } = useProSignupNav({
    flow,
    form,
    skillSel,
    focus,
    fix,
    step4Ok,
    step5Ok,
    step6Ok,
    fromMenu,
    fromProfile,
    routerReplace: (href) => router.replace(href),
    routerPush: (href) => router.push(href),
    go,
    finish,
  });

  const stepTitles: Record<Step, string> = {
    1: "Choose your trade",
    2: skill
      ? `Your ${PRO_SERVICE_LABELS[skill] || "trade"} focus`
      : "Choose your focus",
    3: "Vehicles you fix",
    4: "About you",
    5: "Contact & security",
    6: "Service area",
    7: "Review & create",
  };

  if (fix.vehiclePicker) {
    return (
      <VehicleCascadePicker
        exiting={exiting}
        pickerKey={fix.vehiclePicker}
        fix={fix}
        styles={styles}
      />
    );
  }

  if (focus.pickerKey) {
    return (
      <PrefPicker
        exiting={exiting}
        pickerKey={focus.pickerKey}
        focus={focus}
        styles={styles}
      />
    );
  }

  return (
    <AppleProWizard
      isLight={isLight}
      className={exiting ? "om-auth-exit" : "om-auth-enter"}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[390px] flex-1 flex-col">
        <AppleProTitle
          title={stepTitles[step]}
          subtitle={
            form.dualSignup
              ? "Continue as Repair Pro with your Customer details"
              : "Create your Repair Pro account"
          }
          isLight={isLight}
          stepLabel={`Step ${FLOW_STEPS.indexOf(step) + 1} of ${FLOW_STEPS.length}`}
        />
        <AppleProProgress
          total={FLOW_STEPS.length}
          index={FLOW_STEPS.indexOf(step)}
          isLight={isLight}
        />

        <AppleProBody
          className={cn(step === 1 ? "flex flex-col overflow-hidden" : "gap-1")}
        >
          {step === 1 && (
            <StepTrade
              skill={skill}
              isLight={isLight}
              onSelect={(id) => skillSel.selectSkill(id)}
            />
          )}
          {step === 2 && skill && (
            <StepSpecialty
              skill={skill}
              specialty={specialty}
              options={skillSel.specialtyOptions}
              isLight={isLight}
              onSelect={skillSel.setSpecialty}
            />
          )}
          {step === 4 && (
            <StepAbout form={form} styles={styles} phoneCodes={phoneCodes} />
          )}
          {step === 5 && (
            <StepContact
              form={form}
              styles={styles}
              phoneCodes={phoneCodes}
              formError={formError}
            />
          )}
          {step === 3 && needsVehicleStep && <StepVehicles fix={fix} />}
          {step === 6 && <StepArea form={form} styles={styles} />}
          {step === 7 && (
            <StepReview
              form={form}
              skill={skill}
              specialty={specialty}
              vehiclesCanFix={fix.vehiclesCanFix}
            />
          )}

          {formError && step !== 5 ? (
            <p className="mb-2 text-center text-[12px] font-medium text-red-700">
              {formError}
            </p>
          ) : null}
        </AppleProBody>

        <AppleProFooter
          isLight={isLight}
          hideBack={step === 1 && !form.dualSignup}
          onBack={goBack}
          nextLabel={
            step < 7
              ? "Continue"
              : busy
                ? "Please wait…"
                : "Finish and create account"
          }
          nextBusy={busy}
          nextDisabled={
            busy ||
            (step === 1 && !skill) ||
            (step === 2 && !specialty?.trim()) ||
            (step === 4 && !step4Ok) ||
            (step === 5 && !step5Ok) ||
            (step === 6 && !step6Ok)
          }
          onNext={onNext}
        />
      </div>

      <RegistrationComplete
        open={done}
        accountLabel="Repair Pro"
        onContinue={() => {
          router.replace("/dashboard");
        }}
      />
    </AppleProWizard>
  );
}
