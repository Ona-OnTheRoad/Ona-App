"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Job flow chrome: the same solid white stage as the redesigned screens
 * (Ona UI v2 tokens, dark theme handled by `.ona2`). No glass, no double panels.
 */
export function JobShell({
  isLight,
  title,
  subtitle,
  onBack,
  children,
  footer,
  fullBleed,
  compactHeader = false,
  /** Body fills height without outer scroll (map + swipe sheet layouts) */
  fillBody = false,
  /** Override the back icon (default: ArrowLeft) */
  backIcon,
  /** Right-side slot (e.g. ☰ menu) rendered opposite the back button */
  rightSlot,
}: {
  isLight: boolean;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  fullBleed?: boolean;
  /** Smaller title / subtitle (e.g. describe-problem) */
  compactHeader?: boolean;
  fillBody?: boolean;
  backIcon?: ReactNode;
  rightSlot?: ReactNode;
}) {
  // `ona2` scopes the v2 colour tokens (white light / #111114 dark) to this screen.
  const stage = "ona2 bg-ona-bg";
  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-white/60";

  return (
    <div className={cn("relative flex h-full min-h-0 flex-1 flex-col", stage)}>
      <header className="relative z-10 flex shrink-0 items-center gap-2 px-4 pb-1.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg border-0",
              compactHeader ? "h-8 w-8" : "h-9 w-9",
              "bg-transparent text-ona-ink",
            )}
            aria-label="Back"
          >
            {backIcon ?? (
              <ArrowLeft className={compactHeader ? "h-4 w-4" : "h-5 w-5"} />
            )}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              "font-black tracking-tight",
              compactHeader
                ? "text-[16px] leading-none"
                : "text-[22px] leading-tight",
              ink,
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                "mt-0.5 font-medium",
                compactHeader ? "text-[11px] leading-snug" : "text-[13px]",
                muted,
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot}
      </header>

      <div
        className={cn(
          "relative z-10 min-h-0 flex-1",
          fillBody
            ? "flex flex-col overflow-hidden"
            : "overflow-y-auto overscroll-contain scrollbar-hide",
          fullBleed ? "px-0" : "px-4 pb-6",
        )}
      >
        {children}
      </div>

      {footer && (
        <div
          className={cn(
            "relative z-20 shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3",
            stage,
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * Content block on the main stage.
 * Default: no gray fill (transparent) so text sits on the stage.
 * Pass className to opt into a surface if needed.
 */
export function JobCard({
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
        "rounded-md bg-transparent p-0",
        isLight ? "text-slate-900" : "text-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CopperButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border-0 bg-[#FF6B35] text-[15px] font-black text-white transition active:scale-[0.99] disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  /** Kept for callers; colours now come from the v2 tokens (light and dark). */
  isLight?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center rounded-md border-0 text-[14px] font-bold transition",
        "border border-ona-border bg-ona-field text-ona-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Blended stage buttons light gray / dark gray, soft square corners */
export function StageButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Kept for callers; colours now come from the v2 tokens (light and dark). */
  isLight?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center rounded-md border-0 text-[14px] font-bold transition active:scale-[0.99] disabled:opacity-50",
        "border border-ona-border bg-ona-field text-ona-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}
