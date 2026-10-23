"use client";

import { ArrowLeft } from "lucide-react";

interface PrivacyScreenHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  onBack: () => void;
}

export function PrivacyScreenHeader({
  title,
  subtitle,
  description,
  onBack,
}: PrivacyScreenHeaderProps) {
  return (
    <div className="pt-2 pb-1">
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 w-10 -ml-2 items-center justify-center rounded-full text-ona-ink hover:bg-ona-field transition-colors cursor-pointer"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
      </button>

      <h1 className="mt-3 text-[20px] font-semibold text-ona-ink tracking-tight">
        {title}
      </h1>

      {subtitle ? (
        <p className="mt-0.5 text-[14px] font-normal text-ona-muted">
          {subtitle}
        </p>
      ) : null}

      {description ? (
        <p className="mt-2 text-[14px] font-normal text-ona-muted leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  );
}
