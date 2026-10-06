"use client";

/**
 * Apple-premium Pro onboarding system (initial signup + Tap-to-switch setup).
 * One surface only: #c8c9cd light / black dark. No nested gray cards.
 * Hairline list rows + large title + bottom primary CTA.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { proSheetBg } from "./apple-pro-wizard/tokens";

export {
  PRO_ACCENT,
  PRO_CTA,
  PRO_SHEET_DARK,
  PRO_SHEET_LIGHT,
  appleProFieldClass,
  appleProSelectClass,
  appleProTextareaClass,
  proSheetBg,
} from "./apple-pro-wizard/tokens";
export {
  AppleProList,
  AppleProOptionRow,
  AppleProRow,
} from "./apple-pro-wizard/list-parts";
export { AppleProFooter } from "./apple-pro-wizard/footer";

/** Full-height wizard frame single sheet color, no extra stage fills */
export function AppleProWizard({
  isLight,
  children,
  className,
}: {
  isLight: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden",
        className,
      )}
      style={{ backgroundColor: proSheetBg(isLight) }}
    >
      {children}
    </div>
  );
}

/** Large title block (Apple-style) */
export function AppleProTitle({
  title,
  subtitle,
  isLight,
  stepLabel,
}: {
  title: string;
  subtitle?: string;
  isLight: boolean;
  stepLabel?: string;
}) {
  return (
    <div className="shrink-0 px-5 pb-3 pt-2">
      {stepLabel ? (
        <p
          className={cn(
            "mb-1 text-[12px] font-semibold tracking-wide",
            isLight ? "text-slate-700" : "text-white/70",
          )}
        >
          {stepLabel}
        </p>
      ) : null}
      <h1
        className={cn(
          "text-[28px] font-bold leading-tight tracking-tight",
          isLight ? "text-[#1c1c1e]" : "text-white",
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={cn(
            "mt-1.5 text-[14px] font-medium leading-snug",
            isLight ? "text-slate-600" : "text-white/55",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** Thin progress dashes */
export function AppleProProgress({
  total,
  index,
  isLight,
}: {
  total: number;
  index: number;
  isLight: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-1 px-5 pb-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-0.5 flex-1 rounded-full",
            i <= index
              ? "bg-[#FF6B35]"
              : isLight
                ? "bg-black/12"
                : "bg-white/15",
          )}
        />
      ))}
    </div>
  );
}

/** Scrollable body between title and footer */
export function AppleProBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto px-5 pb-2 scrollbar-hide",
        className,
      )}
    >
      {children}
    </div>
  );
}
