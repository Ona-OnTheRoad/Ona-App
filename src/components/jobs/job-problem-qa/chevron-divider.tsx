import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChevronDivider({
  offset,
  hasMore,
  retreat,
  advance,
  isLight,
}: {
  offset: number;
  hasMore: boolean;
  retreat: () => void;
  advance: () => void;
  isLight: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-between py-1">
      <div className="shrink-0">
        {offset > 0 ? (
          <button
            type="button"
            onClick={retreat}
            aria-label="Show previous questions"
            className="border-0 bg-transparent p-0"
          >
            <span
              className={cn(
                "om-bounce-arrow-back flex h-7 w-7 items-center justify-center rounded-full",
                isLight
                  ? "bg-[#c8c9cd] text-slate-900 shadow-sm"
                  : "bg-black text-white shadow-sm",
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.75} />
            </span>
          </button>
        ) : (
          <span className="block h-7 w-7" aria-hidden="true" />
        )}
      </div>
      <div className="shrink-0">
        {hasMore ? (
          <button
            type="button"
            onClick={advance}
            aria-label="Show more questions"
            className="border-0 bg-transparent p-0"
          >
            <span
              className={cn(
                "om-bounce-arrow flex h-7 w-7 items-center justify-center rounded-full",
                isLight
                  ? "bg-[#c8c9cd] text-slate-900 shadow-sm"
                  : "bg-black text-white shadow-sm",
              )}
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.75} />
            </span>
          </button>
        ) : (
          <span className="block h-7 w-7" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
