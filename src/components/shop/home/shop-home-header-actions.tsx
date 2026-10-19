import { ShoppingBag, ShoppingCart } from "lucide-react";

type Props = {
  cartCount: number;
  onOrders: () => void;
  onCart: () => void;
};

const iconBtn =
  "relative inline-flex h-9 w-9 items-center justify-center rounded-full border-0 bg-ona-field text-ona-ink active:bg-ona-field-strong";

/** Orders + cart icon buttons shown beside the Shop title. */
export function ShopHomeHeaderActions({ cartCount, onOrders, onCart }: Props) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label="Orders"
        onClick={onOrders}
        className={iconBtn}
      >
        <ShoppingBag className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
        onClick={onCart}
        className={iconBtn}
      >
        <ShoppingCart className="h-[18px] w-[18px] text-ona-brand-ink" />
        {cartCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-ona-brand-btn px-1 text-center text-[10px] font-bold leading-4 text-white">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
