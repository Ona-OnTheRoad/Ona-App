"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { CartLineRow } from "@/components/shop/cart-line-row";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { detectCurrency, formatMoney, fromMinorUnits } from "@/lib/pricing";
import type { CartView } from "@/lib/types/shop-cart";
import {
  shopGetCart,
  shopRemoveCartItem,
  shopUpdateCartItem,
} from "@/lib/shop/client";
import { useApp } from "@/lib/store";

function formatPrice(minor: number): string {
  return formatMoney(fromMinorUnits(minor, "NGN"), detectCurrency());
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CartSheet({ open, onClose }: Props) {
  const { accountType, isAuthenticated } = useApp();
  const router = useRouter();
  const ctx = accountType === "professional" ? "professional" : "motorist";
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated || !open) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await shopGetCart(ctx);
      setCart(data.cart);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load cart");
    } finally {
      setLoading(false);
    }
  }, [ctx, isAuthenticated, open]);

  useEffect(() => {
    void load();
  }, [load]);

  const decrement = (line: CartView["items"][number]) => {
    if (line.qty <= 1) {
      setCart((c) =>
        c ? { ...c, items: c.items.filter((x) => x.id !== line.id) } : c,
      );
      void shopRemoveCartItem(line.id)
        .then((d) => setCart(d.cart))
        .catch(() => void load());
      return;
    }
    setCart((c) =>
      c
        ? {
            ...c,
            items: c.items.map((x) =>
              x.id === line.id ? { ...x, qty: x.qty - 1 } : x,
            ),
          }
        : c,
    );
    shopUpdateCartItem(line.id, line.qty - 1)
      .then((d) => setCart(d.cart))
      .catch(() => {
        setError("Update failed");
        void load();
      });
  };
  const increment = (line: CartView["items"][number]) => {
    setCart((c) =>
      c
        ? {
            ...c,
            items: c.items.map((x) =>
              x.id === line.id ? { ...x, qty: x.qty + 1 } : x,
            ),
          }
        : c,
    );
    shopUpdateCartItem(line.id, line.qty + 1)
      .then((d) => setCart(d.cart))
      .catch(() => {
        setError("Update failed");
        void load();
      });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      heightPercent={60}
      growToPercent={85}
      surface="ona"
      className="ona2"
    >
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="text-[16px] font-bold text-ona-ink">Cart</h2>
        {!isAuthenticated ? (
          <p className="py-6 text-center text-[13px] text-ona-muted">
            Sign in to view your cart.
          </p>
        ) : loading ? (
          <div className="flex justify-center py-10">
            <Loader2
              aria-label="Loading cart"
              className="h-6 w-6 animate-spin text-ona-brand-ink"
            />
          </div>
        ) : error ? (
          <p
            role="alert"
            className="py-6 text-center text-[13px] text-ona-danger"
          >
            {error}
          </p>
        ) : !cart || cart.items.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingCart
              aria-hidden
              className="mx-auto h-8 w-8 text-ona-muted"
            />
            <p className="mt-2 text-[13px] text-ona-muted">
              Your cart is empty.
            </p>
            <Button
              variant="ona"
              size="ona"
              className="mx-auto mt-4 w-auto px-6"
              onClick={() => {
                onClose();
                router.push("/shop");
              }}
            >
              Browse Shop
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {cart.items.map((line) => (
                <CartLineRow
                  key={line.id}
                  name={line.productName}
                  sku={line.sku}
                  priceLabel={formatPrice(line.lineTotalMinor)}
                  qty={line.qty}
                  inStock={line.inStock}
                  onDecrement={() => decrement(line)}
                  onIncrement={() => increment(line)}
                />
              ))}
            </div>
            <Button
              variant="ona"
              size="ona"
              className="mt-3"
              onClick={() => {
                onClose();
                router.push("/shop/checkout");
              }}
            >
              Checkout · {formatPrice(cart.subtotalMinor)}
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
