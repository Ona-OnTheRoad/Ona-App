import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isLight: boolean;
  qty: number;
  onDecrement: () => void;
  onIncrement: () => void;
};

export function ProductSheetQuantity({
  isLight,
  qty,
  onDecrement,
  onIncrement,
}: Props) {
  const stepBtn = cn(
    "flex h-8 w-8 items-center justify-center rounded-lg border-0 text-[14px] font-bold",
    isLight ? "bg-black/10 text-slate-900" : "bg-white/10 text-white",
  );
  return (
    <div
      className={cn(
        "mt-3 flex items-center justify-between rounded-xl p-2.5",
        isLight ? "bg-black/[0.02]" : "bg-white/[0.02]",
      )}
    >
      <span className="text-[12px] font-bold">Quantity</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onDecrement} className={stepBtn}>
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-6 text-center text-[14px] font-black">
          {qty}
        </span>
        <button type="button" onClick={onIncrement} className={stepBtn}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
