"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { EdgeToEdgeTop } from "@/components/layout/edge-to-edge-top";
import { cn } from "@/lib/utils";
import { OnaWordmark } from "./ona-wordmark";

/**
 * Full-height page chain for redesigned screens (docs/UI.md):
 * outer flex h-full min-h-0 flex-col overflow-hidden → header shrink-0 →
 * body min-h-0 flex-1 overflow-y-auto → footer shrink-0.
 *
 * `wordmark` shows the Ona. header bar with a hairline; `onBack` shows the
 * back arrow (callers pass the logical-parent handler, never router.back()).
 */
export function OnaScreen({
  children,
  footer,
  onBack,
  backLabel = "Back",
  wordmark,
  exiting,
  className,
  bodyClassName,
  footerClassName,
  edgeTop,
}: {
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  wordmark?: boolean;
  exiting?: boolean;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  /**
   * The body (a map) runs behind the status bar and the back button floats over it, instead of a
   * white header row above the map.
   */
  edgeTop?: boolean;
}) {
  return (
    <div
      className={cn(
        "ona2 relative flex h-full min-h-0 flex-col overflow-hidden",
        className,
      )}
    >
      {edgeTop ? (
        <>
          <EdgeToEdgeTop />
          {/* Fade so the clock / signal icons stay readable over the map */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[calc(env(safe-area-inset-top,0px)*1.6)] bg-gradient-to-b from-black/40 to-transparent"
          />
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="absolute left-4 top-[calc(env(safe-area-inset-top,0px)+0.5rem)] z-50 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-ona-surface text-ona-ink shadow-md"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </button>
          ) : null}
        </>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col om-auth-enter",
          exiting && "om-auth-exit",
        )}
      >
        {wordmark ? (
          <header className="flex shrink-0 justify-center border-b border-ona-border pb-3 pt-5">
            <OnaWordmark />
          </header>
        ) : null}
        {onBack && !edgeTop ? (
          <div className="shrink-0 px-5 pt-4">
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-ona-ink"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        ) : null}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 scrollbar-hide",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <div
            className={cn(
              "shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2",
              footerClassName,
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function OnaTitle({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ona-ink">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1.5 text-[13px] leading-snug text-ona-muted">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
