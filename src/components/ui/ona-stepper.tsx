import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const stepBtn =
  "flex h-8 w-8 items-center justify-center rounded-full border-0 bg-ona-field text-ona-ink active:bg-ona-field-strong disabled:opacity-40";

/** Compact − qty + control. `removeAtOne` swaps the minus for a trash icon (cart lines). */
export function OnaStepper({
  qty,
  onDecrement,
  onIncrement,
  removeAtOne,
  disableIncrement,
  className,
}: {
  qty: number;
  onDecrement: () => void;
  onIncrement: () => void;
  removeAtOne?: boolean;
  disableIncrement?: boolean;
  className?: string;
}) {
  const trash = removeAtOne && qty <= 1;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label={trash ? "Remove item" : "Decrease quantity"}
        onClick={onDecrement}
        className={stepBtn}
      >
        {trash ? (
          <Trash2 className="h-3.5 w-3.5" />
        ) : (
          <Minus className="h-3.5 w-3.5" />
        )}
      </button>
      <span
        aria-live="polite"
        className="min-w-5 text-center text-[13px] font-semibold tabular-nums text-ona-ink"
      >
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disableIncrement}
        onClick={onIncrement}
        className={stepBtn}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
