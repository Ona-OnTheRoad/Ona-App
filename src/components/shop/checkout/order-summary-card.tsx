"use client";

import { formatShopPrice } from "@/components/shop/shared/format-shop-price";
import type { CartView } from "@/lib/types/shop-cart";
import type { DeliveryEstimateView } from "@/lib/shop/client";
import { cn } from "@/lib/utils";

export function OrderSummaryCard({
  card,
  muted,
  border,
  cart,
  subtotalMinor,
  estimating,
  estimate,
  deliveryFeeMinor,
  total,
}: {
  card: string;
  muted: string;
  border: string;
  cart: CartView;
  subtotalMinor: number;
  estimating: boolean;
  estimate: DeliveryEstimateView["estimate"] | null;
  deliveryFeeMinor: number;
  total: number;
}) {
  return (
    <div className={cn("mt-2 rounded-xl p-3", card)}>
      <p className="text-[13px] font-black">Order summary</p>
      <ul className="mt-2 space-y-1.5">
        {cart.items.map((l) => (
          <li
            key={l.id}
            className="flex justify-between text-[12px] font-medium"
          >
            <span className="min-w-0 flex-1 truncate pr-2">
              {l.qty}× {l.productName}
            </span>
            <span>{formatShopPrice(l.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>
      <div className={cn("mt-3 space-y-1 border-t pt-2 text-[12px]", border)}>
        <div className="flex justify-between">
          <span className={muted}>Subtotal</span>
          <span>{formatShopPrice(subtotalMinor)}</span>
        </div>
        <div className="flex justify-between">
          <span className={muted}>Delivery</span>
          <span>
            {estimating
              ? "…"
              : estimate?.freeDelivery
                ? "Free"
                : formatShopPrice(deliveryFeeMinor)}
          </span>
        </div>
        <div className="flex justify-between text-[14px] font-black">
          <span>Total</span>
          <span className="text-[#FF6B35]">{formatShopPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
