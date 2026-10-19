"use client";

import { useT } from "@/lib/i18n";

/** Drag / tap handle that expands or collapses the home sheet. */
export function SheetPill({
  expanded,
  onExpand,
  onCollapse,
  onClick,
  onTouchStart,
  onTouchMove,
}: {
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
      className="flex cursor-grab justify-center pb-1 pt-3 active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
    >
      <span className="h-1 w-10 rounded-full bg-ona-border" />
    </div>
  );
}
