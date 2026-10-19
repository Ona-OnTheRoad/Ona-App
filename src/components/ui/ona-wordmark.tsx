import { cn } from "@/lib/utils";

/** "Ona." wordmark: ink letters, coral full stop. */
export function OnaWordmark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Ona"
      className={cn(
        "inline-flex items-baseline text-[28px] font-black leading-none tracking-tight text-ona-ink",
        className,
      )}
    >
      <span aria-hidden>Ona</span>
      <span aria-hidden className="text-ona-brand">
        .
      </span>
    </span>
  );
}
