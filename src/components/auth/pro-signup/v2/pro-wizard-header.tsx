"use client";

import { ArrowLeft } from "lucide-react";

interface ProWizardHeaderProps {
  currentStep: number;
  totalSteps?: number;
  onBack?: () => void;
  showBack?: boolean;
  showProgress?: boolean;
}

export function ProWizardHeader({
  currentStep,
  totalSteps = 5,
  onBack,
  showBack = true,
  showProgress = currentStep > 0,
}: ProWizardHeaderProps) {
  return (
    <div className="w-full bg-ona-bg pt-3 pb-2 px-4">
      {/* Top Bar with Back, Logo, and balancing spacer */}
      <div className="relative flex items-center justify-between h-10">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 -ml-1 text-ona-ink hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        <div className="text-xl font-bold tracking-tight text-ona-ink font-sans">
          Ona<span className="text-brand">.</span>
        </div>

        <div className="w-9" />
      </div>

      {/* Segmented Progress bar */}
      {showProgress && currentStep > 0 ? (
        <div className="mt-3 flex items-center gap-1.5 w-full">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum <= currentStep;
            return (
              <div
                key={stepNum}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  isActive ? "bg-brand" : "bg-ona-border"
                }`}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
