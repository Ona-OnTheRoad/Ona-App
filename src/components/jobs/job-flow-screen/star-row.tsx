import type { ReactElement } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  interactive: boolean;
  isLight: boolean;
  /** Currently selected rating (interactive row only). */
  rating: number;
  alreadyLeft: boolean;
  setRating: (n: number) => void;
}

/** 5-star row: interactive radiogroup for the form, read-only for results. */
export function StarRow({
  value,
  interactive,
  isLight,
  rating,
  alreadyLeft,
  setRating,
}: Props): ReactElement {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role={interactive ? "radiogroup" : "img"}
      aria-label={
        interactive
          ? "Rate the Repair Pro"
          : value > 0
            ? `Rated ${value} out of 5`
            : "No rating yet"
      }
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value > 0 && value >= n;
        if (!interactive) {
          return (
            <Star
              key={n}
              className={cn(
                "h-8 w-8",
                on
                  ? "fill-[#FF6B35] text-[#FF6B35]"
                  : isLight
                    ? "fill-transparent text-slate-400"
                    : "fill-transparent text-white/35",
              )}
              strokeWidth={1.75}
              aria-hidden
            />
          );
        }
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            disabled={alreadyLeft}
            onClick={() => setRating(n)}
            className="border-0 bg-transparent p-1 transition active:scale-95 disabled:opacity-70"
          >
            <Star
              className={cn(
                "h-9 w-9",
                on
                  ? "fill-[#FF6B35] text-[#FF6B35]"
                  : isLight
                    ? "fill-transparent text-slate-400"
                    : "fill-transparent text-white/35",
              )}
              strokeWidth={1.75}
            />
          </button>
        );
      })}
    </div>
  );
}
