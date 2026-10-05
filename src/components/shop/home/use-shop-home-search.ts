import { useState } from "react";
import type { ShopHomeProduct } from "./shop-home-types";

export function useShopHomeSearch(ctx: string) {
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ShopHomeProduct[] | null>(null);
  const [intentLabel, setIntentLabel] = useState<string | null>(null);
  const [suggestedTrade, setSuggestedTrade] = useState<string | null>(null);

  const runSearch = async () => {
    const query = q.trim();
    if (!query) {
      setResults(null);
      setIntentLabel(null);
      setSuggestedTrade(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/shop/search?q=${encodeURIComponent(query)}&ctx=${encodeURIComponent(ctx)}`,
      );
      const json = (await res.json()) as {
        ok?: boolean;
        data?: {
          results?: ShopHomeProduct[];
          suggestedTradeKey?: string | null;
          intent?: {
            tradeKey?: string | null;
            productHints?: string[];
            make?: string | null;
            model?: string | null;
            year?: number | null;
          };
        };
      };
      if (json.ok && json.data) {
        setResults(json.data.results ?? []);
        const i = json.data.intent;
        const tradeKey = json.data.suggestedTradeKey || i?.tradeKey || null;
        setSuggestedTrade(tradeKey);
        const bits = [
          tradeKey ? `Trade: ${tradeKey}` : null,
          i?.make,
          i?.model,
          i?.year ? String(i.year) : null,
          ...(i?.productHints ?? []),
        ].filter(Boolean);
        setIntentLabel(bits.length ? bits.join(" · ") : "Search results");
      }
    } finally {
      setSearching(false);
    }
  };

  return {
    q,
    setQ,
    searching,
    results,
    setResults,
    intentLabel,
    setIntentLabel,
    suggestedTrade,
    setSuggestedTrade,
    runSearch,
  };
}
