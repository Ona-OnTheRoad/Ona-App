import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "+ Enter another vehicle" style action: a rounded pill centred on a full-width
 * hairline (the Ona add-row pattern). Renders a real button.
 */
export function OnaAddPill({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center py-1",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px bg-ona-border"
      />
      <button
        type="button"
        onClick={onClick}
        className="relative flex h-11 items-center gap-2 rounded-full border border-ona-border bg-ona-field px-5 text-[15px] font-medium text-ona-ink"
      >
        <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
        {children}
      </button>
    </div>
  );
}
