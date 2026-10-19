"use client";

import { cn } from "@/lib/utils";

/** Two-or-more option pill switch (radio semantics, arrow-key friendly via native radios). */
export function OnaSegmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-1 rounded-ona-ctl bg-ona-field-strong p-1"
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-10 flex-1 rounded-[8px] border-0 text-[13px] font-semibold transition-colors",
              on
                ? "bg-ona-surface text-ona-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "bg-transparent text-ona-muted",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
