import { ShoppingBag, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isLight: boolean;
  accentText: string;
  cartCount: number;
  onOrders: () => void;
  onCart: () => void;
};

export function ShopHomeHeaderActions({
  isLight,
  accentText,
  cartCount,
  onOrders,
  onCart,
}: Props) {
  return (
    <div className="flex justify-end gap-1 px-3 pt-1">
      <button
        type="button"
        aria-label="Orders"
        onClick={onOrders}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent active:opacity-70",
          isLight ? "text-slate-800" : "text-white",
        )}
      >
        <ShoppingBag className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        aria-label="Cart"
        onClick={onCart}
        className={cn(
          "relative inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent active:opacity-70",
          isLight ? "text-slate-800" : "text-white",
        )}
      >
        <span className="relative inline-flex">
          <ShoppingCart className="h-[18px] w-[18px]" />
          {cartCount > 0 ? (
            <span
              className="absolute -right-2 -top-1.5 text-[10px] font-black"
              style={{ color: accentText }}
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
        </span>
      </button>
    </div>
  );
}
