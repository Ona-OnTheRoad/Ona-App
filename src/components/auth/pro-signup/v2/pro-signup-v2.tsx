"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { RegistrationComplete } from "@/components/auth/registration-complete";
import { useApp } from "@/lib/store";
import { loadSignupDraft } from "@/lib/signup-draft";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import type { BankDetailsValue } from "@/components/auth/bank-details-fields/types";
import { useProSignupFlow } from "../use-pro-signup-flow";
import { useProSignupForm } from "../use-pro-signup-form";
import { useProSignupSubmit } from "../use-pro-signup-submit";
import { useSkillSelection } from "../use-skill-selection";
import { useVehicleFocus } from "../use-vehicle-focus";
import { useVehiclesCanFix } from "../use-vehicles-can-fix";
import { ProWizardHeader } from "./pro-wizard-header";
import { Step1BaseLocation } from "./step1-base-location";
import { Step2RepairService } from "./step2-repair-service";
import { Step3Vehicles } from "./step3-vehicles";
import { Step4Guarantor } from "./step4-guarantor";
import { Step5BankAccount } from "./step5-bank-account";

export function ProSignupV2() {
  const router = useRouter();
  const { go } = useAuthNavigate();
  const searchParams = useSearchParams();
  const { completeSignup, userProfile, isAuthenticated } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [anyVehicles, setAnyVehicles] = useState(true);

  const fromMenu = searchParams.get("from") === "menu";
  const fromProfile = searchParams.get("from") === "profile";

  const flow = useProSignupFlow();
  const { done, busy, formError, setBusy, setDone, setFormError } = flow;
  useFeedbackToast("", formError);

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

  const { finish } = useProSignupSubmit({
    form,
    flow,
    skillSel,
    focus,
    fix,
    stepsOk: true,
    userProfile,
    refCode: searchParams.get("ref") || loadSignupDraft()?.referral || null,
    completeSignup,
    replace: (href) => router.replace(href),
  });

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
      return;
    }
    if (fromMenu || fromProfile) {
      router.back();
    } else {
      go("/login/role");
    }
  };

  const handleFinalSubmit = async (bankDetails?: BankDetailsValue) => {
    try {
      setBusy(true);
      if (userProfile && bankDetails?.bankCode) {
        const { saveProfileToVault } = await import("@/lib/profiles-vault");
        saveProfileToVault({
          ...userProfile,
          bankCode: bankDetails.bankCode,
          bankName: bankDetails.bankName,
          bankAccountNumber: bankDetails.bankAccountNumber,
          bankAccountName: bankDetails.bankAccountName,
        });
      }
      await finish(bankDetails);
      setDone(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full max-w-md mx-auto bg-white dark:bg-[#121316]">
      {/* 5-step Header with back button, Ona. logo and progress bar */}
      <ProWizardHeader
        currentStep={step}
        totalSteps={5}
        onBack={handleBack}
        showBack={true}
      />

      {/* Wizard Steps */}
      <div className="flex flex-col flex-1">
        {step === 1 && (
          <Step1BaseLocation
            city={form.city}
            setCity={form.setCity}
            area={form.area}
            setArea={form.setArea}
            serviceRadiusKm={form.serviceRadiusKm}
            setServiceRadiusKm={form.setServiceRadiusKm}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2RepairService
            skill={skill}
            onSelectSkill={(s) => skillSel.selectSkill(s)}
            specialty={specialty || ""}
            onSelectSpecialty={(spec) => skillSel.setSpecialty(spec)}
            businessName={form.businessName}
            setBusinessName={form.setBusinessName}
            yearsExperience={form.yearsExperience}
            setYearsExperience={form.setYearsExperience}
            bio={form.bio}
            setBio={form.setBio}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3Vehicles
            vehicles={fix.vehiclesCanFix}
            setVehicles={fix.setVehiclesCanFix}
            anyType={anyVehicles}
            setAnyType={setAnyVehicles}
            onContinue={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <Step4Guarantor
            guarantorName={form.guarantorName}
            setGuarantorName={form.setGuarantorName}
            guarantorPhone={form.guarantorPhone}
            setGuarantorPhone={form.setGuarantorPhone}
            guarantorOccupation={form.guarantorOccupation}
            setGuarantorOccupation={form.setGuarantorOccupation}
            guarantorAddress={form.guarantorAddress}
            setGuarantorAddress={form.setGuarantorAddress}
            guarantorRelationship={form.guarantorRelationship}
            setGuarantorRelationship={form.setGuarantorRelationship}
            onContinue={() => setStep(5)}
          />
        )}

        {step === 5 && (
          <Step5BankAccount
            signupFullName={form.fullName || userProfile?.fullName}
            onContinue={(details) => handleFinalSubmit(details)}
            onSkip={() => handleFinalSubmit()}
            busy={busy}
          />
        )}
      </div>

      <RegistrationComplete
        open={done}
        accountLabel="Repair Pro"
        onContinue={() => {
          router.replace("/dashboard");
        }}
      />
    </div>
  );
}
