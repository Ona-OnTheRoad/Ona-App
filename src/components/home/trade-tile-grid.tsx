"use client";

import { useT } from "@/lib/i18n";
import type { ServiceCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TradeTile } from "@/components/home/trade-tiles";

/**
 * Trade picker. Full mode: 4-column grid of separate rounded tiles (icon over label),
 * no divider lines.
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
      className="grid grid-cols-4 gap-2"
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
              "flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border-0 px-1.5 py-2 text-[10px] font-medium transition-colors active:bg-ona-field-strong",
              on
                ? "bg-ona-brand-soft text-ona-brand-ink"
                : "bg-ona-field text-ona-ink",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={on ? 2.3 : 1.8} />
            <span className="max-w-full truncate leading-none">
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
