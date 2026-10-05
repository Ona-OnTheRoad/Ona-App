import { useCallback, useEffect, useState } from "react";
import { shopGetCart } from "@/lib/shop/client";

export function useShopHomeCart(
  isAuthenticated: boolean,
  accountType: string | null | undefined,
) {
  const [cartCount, setCartCount] = useState(0);
  const [cartQtyById, setCartQtyById] = useState<Record<string, number>>({});

  const refreshCartCount = useCallback(async () => {
    try {
      const res = await shopGetCart(
        accountType === "professional" ? "professional" : "motorist",
      );
      setCartCount(res.cart?.itemCount ?? 0);
      const map: Record<string, number> = {};
      for (const line of res.cart?.items ?? []) {
        map[String(line.productId)] =
          (map[String(line.productId)] || 0) + line.qty;
      }
      setCartQtyById(map);
    } catch {
      setCartCount(0);
      setCartQtyById({});
    }
  }, [accountType]);

  /** Instant optimistic bump, reverted if the background add fails */
  const optimisticAdd = useCallback((productId: string) => {
    setCartCount((c) => c + 1);
    setCartQtyById((m) => ({ ...m, [productId]: (m[productId] || 0) + 1 }));
  }, []);
  const optimisticRevert = useCallback(
    (productId: string) => {
      setCartCount((c) => Math.max(0, c - 1));
      setCartQtyById((m) => {
        const next = { ...m };
        const q = (next[productId] || 0) - 1;
        if (q > 0) next[productId] = q;
        else delete next[productId];
        return next;
      });
      void refreshCartCount();
    },
    [refreshCartCount],
  );

  useEffect(() => {
    if (isAuthenticated) void refreshCartCount();
    else setCartCount(0);
  }, [isAuthenticated, refreshCartCount]);

  return {
    cartCount,
    cartQtyById,
    refreshCartCount,
    optimisticAdd,
    optimisticRevert,
  };
}
