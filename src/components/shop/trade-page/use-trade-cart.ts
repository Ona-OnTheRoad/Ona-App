import { useCallback, useEffect, useState } from "react";
import { shopGetCart } from "@/lib/shop/client";

export function useTradeCart() {
  const [cartQtyById, setCartQtyById] = useState<Record<string, number>>({});
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async () => {
    try {
      const res = await shopGetCart("motorist");
      setCartCount(res.cart?.itemCount ?? 0);
      const map: Record<string, number> = {};
      for (const line of res.cart?.items ?? []) {
        map[String(line.productId)] =
          (map[String(line.productId)] || 0) + line.qty;
      }
      setCartQtyById(map);
    } catch {
      /* cart optional */
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const optimisticAdd = useCallback((productId: string) => {
    setCartCount((c) => c + 1);
    setCartQtyById((m) => ({ ...m, [productId]: (m[productId] || 0) + 1 }));
  }, []);
  const optimisticRevert = useCallback(() => {
    void refreshCart();
  }, []);

  return { cartQtyById, cartCount, optimisticAdd, optimisticRevert };
}
