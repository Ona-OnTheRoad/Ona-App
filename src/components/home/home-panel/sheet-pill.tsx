"use client";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Drag / tap handle that expands or collapses the home sheet. */
export function SheetPill({
  isLight,
  expanded,
  onExpand,
  onCollapse,
  onClick,
  onTouchStart,
  onTouchMove,
}: {
  isLight: boolean;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onClick: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
}) {
  const t = useT();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={expanded ? t("home.collapsePanel") : t("home.expandPanel")}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onExpand();
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onCollapse();
        }
      }}
      className="flex cursor-grab justify-center pb-1.5 pt-2.5 active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
    >
      <span
        className={cn(
          "h-1.5 w-11 rounded-full",
          isLight
            ? "bg-[#6b7280] shadow-sm ring-1 ring-black/10"
            : "bg-white/40",
        )}
      />
    </div>
  );
}
