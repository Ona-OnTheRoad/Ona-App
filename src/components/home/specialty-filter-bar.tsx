"use client";

/**
 * Temporary strip that replaces Radius for Plumber / Carpenter / Painter /
 * Solar / Generator.
 *
 * Pick → orange highlight + list/map filter immediately → after 2s strip
 * hides and Radius returns (filter stays applied).
 */

import {
  isSpecialtyPickerTrade,
  specialtyChipLabel,
  tradeDef,
} from "@/lib/artisan/catalog";
import { useApp } from "@/lib/store";
import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SpecialtyFilterBar() {
  const { category, specialtyFilter, setSpecialtyFilter } = useApp();

  if (!isSpecialtyPickerTrade(category)) return null;

  const trade = tradeDef(category as ProService);
  const options = trade?.specialties ?? [];
  if (options.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto px-4 py-1 scrollbar-hide"
      role="group"
      aria-label={`${trade?.homeLabel || category} specialty`}
    >
      {options.map((opt) => {
        const selected = specialtyFilter === opt;
        return (
          <button
            key={opt}
            type="button"
            title={opt}
            aria-pressed={selected}
            onClick={() => setSpecialtyFilter(opt)}
            className={cn(
              "inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border px-3.5 text-[12px] font-bold transition-colors",
              selected
                ? "border-ona-brand bg-ona-brand-soft text-ona-brand-ink"
                : "border-ona-border bg-ona-surface text-ona-ink",
            )}
          >
            {specialtyChipLabel(opt)}
          </button>
        );
      })}
    </div>
  );
}
