import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  isLight,
  qty,
  setQty,
  clampQty,
}: {
  isLight: boolean;
  qty: number;
  setQty: (updater: (q: number) => number) => void;
  clampQty: (n: number) => number;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex items-center justify-between rounded-xl p-2.5",
        isLight ? "bg-white/90" : "bg-[#1c1c1e]",
      )}
    >
      <span className="text-[12px] font-bold">Quantity</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setQty((q) => clampQty(q - 1))}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border-0 text-[14px] font-bold",
            isLight ? "bg-black/10 text-slate-900" : "bg-white/10 text-white",
          )}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-6 text-center text-[14px] font-black">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => clampQty(q + 1))}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border-0 text-[14px] font-bold",
            isLight ? "bg-black/10 text-slate-900" : "bg-white/10 text-white",
          )}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
