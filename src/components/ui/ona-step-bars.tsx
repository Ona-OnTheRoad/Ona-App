import { cn } from "@/lib/utils";

/** Segmented progress: `current` of `total` bars are coral. */
export function OnaStepBars({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className="flex gap-2"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i < current ? "bg-ona-brand" : "bg-ona-border",
          )}
        />
      ))}
    </div>
  );
}
