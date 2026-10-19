"use client";

import { useRef } from "react";
import {
  calloutUrgencyMultiplier,
  type CalloutUrgencyKind,
} from "@/lib/callout/urgency";
import { cn } from "@/lib/utils";
import type { UrgencyChip } from "../help-flow-configs";

/** Radio list for the urgency step (roving tabindex, arrow keys move + select). */
export function FlowUrgencyList({
  chips,
  urgency,
  onSelect,
}: {
  chips: UrgencyChip[];
  urgency: CalloutUrgencyKind;
  onSelect: (u: CalloutUrgencyKind) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, delta: number) => {
    const next = (from + delta + chips.length) % chips.length;
    onSelect(chips[next].id);
    refs.current[next]?.focus();
  };
  const checkedIdx = chips.findIndex((c) => c.id === urgency);
  return (
    <div
      role="radiogroup"
      aria-label="Urgency"
      className="divide-y divide-ona-border overflow-hidden rounded-ona-card border border-ona-border bg-ona-surface"
    >
      {chips.map((opt, i) => {
        const on = urgency === opt.id;
        const mult = calloutUrgencyMultiplier(opt.id);
        return (
          <button
            key={opt.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (checkedIdx < 0 && i === 0) ? 0 : -1}
            onClick={() => onSelect(opt.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault();
                move(i, 1);
              } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault();
                move(i, -1);
              }
            }}
            className={cn(
              "flex min-h-14 w-full items-center justify-between gap-3 border-0 bg-transparent px-3.5 py-2.5 text-left",
            )}
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-ona-ink">
                {opt.label}
              </span>
              <span className="block text-[12px] font-medium text-ona-muted">
                {mult.toFixed(2)}×
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                on ? "border-ona-brand" : "border-ona-border",
              )}
            >
              {on ? (
                <span className="h-2.5 w-2.5 rounded-full bg-ona-brand" />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
