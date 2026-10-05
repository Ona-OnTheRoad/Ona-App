import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Grouped list hairline only, no fill cards */
export function AppleProList({
  children,
  isLight,
  className,
}: {
  children: ReactNode;
  isLight: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl",
        isLight ? "bg-transparent" : "bg-transparent",
        className,
      )}
    >
      <div
        className={cn(
          "divide-y",
          isLight ? "divide-black/10" : "divide-white/10",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Single hairline field row */
export function AppleProRow({
  label,
  children,
  isLight,
  last,
}: {
  label?: string;
  children: ReactNode;
  isLight: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-1 py-2.5",
        !last &&
          (isLight ? "border-b border-black/10" : "border-b border-white/10"),
      )}
    >
      {label ? (
        <p
          className={cn(
            "mb-1 text-[11px] font-semibold",
            isLight ? "text-slate-500" : "text-white/45",
          )}
        >
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/** Selectable list row (trade / option) no gray well */
export function AppleProOptionRow({
  active,
  isLight,
  onClick,
  children,
}: {
  active: boolean;
  isLight: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-[52px] w-full items-center gap-3 border-0 border-b bg-transparent px-1 py-3 text-left transition-opacity",
        isLight ? "border-black/10" : "border-white/10",
        active ? "opacity-100" : "opacity-80 active:opacity-100",
      )}
    >
      {children}
      {active ? (
        <span className="ml-auto text-[13px] font-bold text-[#FF6B35]">✓</span>
      ) : null}
    </button>
  );
}
