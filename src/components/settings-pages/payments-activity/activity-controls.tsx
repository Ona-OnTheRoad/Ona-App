import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DATE_CHIPS,
  type DateFilter,
  type StatusFilter,
} from "./activity-filters";

export function StatusTabs({
  chips,
  value,
  onChange,
  segLine,
  muted,
}: {
  chips: { key: StatusFilter; label: string }[];
  value: StatusFilter;
  onChange: (k: StatusFilter) => void;
  segLine: string;
  muted: string;
}) {
  return (
    <div
      className={cn("mt-1 flex w-full border-b", segLine)}
      role="tablist"
      aria-label="Status"
    >
      {chips.map(({ key, label }) => {
        const on = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(key)}
            className={cn(
              "relative flex-1 border-0 bg-transparent py-2.5 text-center text-[13px] font-semibold transition-colors",
              on ? "text-[#FF6B35]" : muted,
            )}
          >
            {label}
            {on ? (
              <span
                className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[#FF6B35]"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function PeriodStrip({
  value,
  onChange,
  onReload,
  muted,
}: {
  value: DateFilter;
  onChange: (k: DateFilter) => void;
  onReload: () => void;
  muted: string;
}) {
  return (
    <div className="mt-4 flex items-center gap-2">
      <div
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Time period"
      >
        {DATE_CHIPS.map(({ key, label }) => {
          const on = value === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(key)}
              className={cn(
                "shrink-0 border-0 bg-transparent px-2.5 py-1.5 text-[12px] font-bold tracking-wide transition-colors",
                on ? "text-[#FF6B35]" : muted,
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onReload}
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center border-0 bg-transparent",
          muted,
        )}
        aria-label="Refresh"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}
