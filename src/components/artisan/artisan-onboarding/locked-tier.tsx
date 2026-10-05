import type { ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils";

/**
 * Tier wrapper: dims + blocks a locked tier and routes taps on the overlay
 * to the soft lock popup. `hidden` keeps the tier mounted but invisible
 * (sheet embed shows one tier at a time).
 */
export function LockedTier({
  locked,
  hidden,
  lockMessage,
  onLockedClick,
  panelClass,
  innerClassName,
  wrapRef,
  children,
}: {
  locked: boolean;
  hidden: boolean;
  lockMessage: string;
  onLockedClick: () => void;
  panelClass: string;
  innerClassName?: string;
  wrapRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div
      ref={wrapRef}
      className={cn("relative", hidden ? "hidden" : "", locked && "opacity-45")}
    >
      {locked ? (
        <button
          type="button"
          className="absolute inset-0 z-[2] border-0 bg-transparent"
          aria-label={lockMessage}
          onClick={onLockedClick}
        />
      ) : null}
      <div
        className={cn(
          panelClass,
          innerClassName,
          locked && "pointer-events-none",
        )}
      >
        {children}
      </div>
    </div>
  );
}
