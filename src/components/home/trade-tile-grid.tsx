"use client";

import { useT } from "@/lib/i18n";
import type { ServiceCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TradeTile } from "@/components/home/trade-tiles";

/**
 * Trade picker. Full mode: 3-column tile grid (icon over label).
 * Compact mode (a trade is open): one scrolling row of chips so the flow keeps
 * the room. Plain buttons with aria-pressed (the active trade is a toggle).
 */
export function TradeTileGrid({
  tiles,
  active,
  compact,
  onPick,
}: {
  tiles: TradeTile[];
  active: ServiceCategory;
  compact: boolean;
  onPick: (id: ServiceCategory) => void;
}) {
  const t = useT();
  if (compact) {
    return (
      <div
        role="group"
        aria-label={t("home.serviceCategory")}
        className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide"
      >
        {tiles.map(({ id, labelKey, icon: Icon }) => {
          const on = active === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={id === "all" ? undefined : on}
              onClick={() => onPick(id)}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                on
                  ? "border-ona-brand bg-ona-brand-soft text-ona-brand-ink"
                  : "border-ona-border bg-ona-surface text-ona-ink",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div
      role="group"
      aria-label={t("home.serviceCategory")}
      className="grid grid-cols-3 gap-px overflow-hidden rounded-ona-card border border-ona-border bg-ona-border"
    >
      {tiles.map(({ id, labelKey, icon: Icon }) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={id === "all" ? undefined : on}
            onClick={() => onPick(id)}
            className={cn(
              "flex min-h-[72px] min-w-0 flex-col items-center justify-center gap-1.5 border-0 px-1 py-3 text-[12px] font-medium transition-colors active:bg-ona-field-strong",
              on
                ? "bg-ona-brand-soft text-ona-brand-ink"
                : "bg-ona-surface text-ona-ink",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={on ? 2.3 : 1.8} />
            <span className="max-w-full truncate leading-none">
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
