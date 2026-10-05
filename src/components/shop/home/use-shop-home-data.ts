import { useCallback, useEffect, useState } from "react";
import type { ShopHomeProduct } from "./shop-home-types";

export function useShopHomeData(ctx: string) {
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [popular, setPopular] = useState<ShopHomeProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<ShopHomeProduct[]>([]);
  const [shopTitle, setShopTitle] = useState("Shop");
  const [allowBrowseAllParts, setAllowBrowseAllParts] = useState(true);
  const [defaultTradeKey, setDefaultTradeKey] = useState<string | null>(null);
  const [allowedTradeKeys, setAllowedTradeKeys] = useState<string[] | null>(
    null,
  );

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shop/home?ctx=${encodeURIComponent(ctx)}`);
      const json = (await res.json()) as {
        ok?: boolean;
        data?: {
          popular?: ShopHomeProduct[];
          newArrivals?: ShopHomeProduct[];
          recommended?: ShopHomeProduct[];
          setupRequired?: boolean;
          shopTitle?: string;
          allowBrowseAllParts?: boolean;
          defaultTradeKey?: string | null;
          allowedTradeKeys?: string[] | null;
        };
      };
      if (json.ok && json.data) {
        setPopular(json.data.popular ?? []);
        setNewArrivals(json.data.newArrivals ?? []);
        if (json.data.recommended?.length) {
          setPopular((prev) =>
            prev.length ? prev : (json.data!.recommended ?? []),
          );
        }
        setSetupRequired(Boolean(json.data.setupRequired));
        if (json.data.shopTitle) setShopTitle(json.data.shopTitle);
        setAllowBrowseAllParts(json.data.allowBrowseAllParts !== false);
        setDefaultTradeKey(json.data.defaultTradeKey ?? null);
        setAllowedTradeKeys(json.data.allowedTradeKeys ?? null);
      }
    } catch {
      setSetupRequired(true);
    } finally {
      setLoading(false);
    }
  }, [ctx]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  return {
    loading,
    setupRequired,
    popular,
    newArrivals,
    shopTitle,
    allowBrowseAllParts,
    defaultTradeKey,
    allowedTradeKeys,
  };
}
