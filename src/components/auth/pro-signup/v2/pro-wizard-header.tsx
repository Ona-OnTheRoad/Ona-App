"use client";

import { ArrowLeft } from "lucide-react";

interface ProWizardHeaderProps {
  currentStep: number;
  totalSteps?: number;
  onBack?: () => void;
  showBack?: boolean;
}

export function ProWizardHeader({
  currentStep,
  totalSteps = 5,
  onBack,
  showBack = true,
}: ProWizardHeaderProps) {
  return (
    <div className="w-full bg-white dark:bg-[#121316] pt-3 pb-2 px-4">
      {/* Top Bar with Back, Logo, and balancing spacer */}
      <div className="relative flex items-center justify-between h-10">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 -ml-1 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
          Ona<span className="text-[#FF6B35]">.</span>
        </div>

        <div className="w-9" />
      </div>

      {/* 5-segment Progress bar */}
      <div className="mt-3 flex items-center gap-1.5 w-full">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum <= currentStep;
          return (
            <div
              key={stepNum}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-[#FF6B35]"
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
