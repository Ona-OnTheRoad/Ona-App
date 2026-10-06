import { useCallback, useEffect, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { FacetFilters } from "@/components/shop/shop-facet-bar";
import type { ListingFilterKey } from "@/lib/shop/listing-status";
import type { TradeProductCard } from "./trade-page-types";

type Args = {
  trade: string;
  ctx: string;
  label: string;
  allParts: boolean;
  searchParams: ReadonlyURLSearchParams;
};

export function useTradeSearch({
  trade,
  ctx,
  label,
  allParts,
  searchParams,
}: Args) {
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<TradeProductCard[]>([]);
  const [intentLabel, setIntentLabel] = useState<string | null>(null);
  const [availability, setAvailability] = useState<ListingFilterKey>("all");
  const [facets] = useState<FacetFilters>({
    availability: "all",
    categorySlug: null,
    minPriceMinor: null,
    maxPriceMinor: null,
    attributes: {},
  });

  const runSearch = useCallback(
    async (override?: string, overrideFacets?: FacetFilters) => {
      const query = (override ?? q).trim();
      const f = overrideFacets ?? facets;
      if (!query) {
        setSearched(false);
        setResults([]);
        setIntentLabel(null);
        return;
      }
      setSearching(true);
      setSearched(true);
      try {
        const qs = new URLSearchParams({
          q: query,
          trade,
          lockTrade: "1",
          ctx,
        });
        if (availability !== "all") qs.set("listingStatus", availability);
        if (f.availability === "in_stock") qs.set("availability", "in_stock");
        if (f.categorySlug) qs.set("category", f.categorySlug);
        if (f.minPriceMinor != null)
          qs.set("minPrice", String(f.minPriceMinor));
        if (f.maxPriceMinor != null)
          qs.set("maxPrice", String(f.maxPriceMinor));
        for (const [k, v] of Object.entries(f.attributes)) {
          if (v !== "" && v != null) qs.set(`attr.${k}`, String(v));
        }
        const res = await fetch(`/api/shop/search?${qs.toString()}`);
        const json = (await res.json()) as {
          ok?: boolean;
          data?: {
            results?: TradeProductCard[];
            intent?: {
              make?: string | null;
              model?: string | null;
              year?: number | null;
              productHints?: string[];
            };
          };
        };
        if (json.ok && json.data) {
          setResults(json.data.results ?? []);
          const i = json.data.intent;
          const bits = [
            i?.make,
            i?.model,
            i?.year ? String(i.year) : null,
            ...(i?.productHints ?? []),
          ].filter(Boolean);
          setIntentLabel(
            bits.length ? bits.join(" · ") : `Results in ${label}`,
          );
        } else {
          setResults([]);
          setIntentLabel(null);
        }
      } finally {
        setSearching(false);
      }
    },
    [q, trade, label, ctx, facets, availability],
  );

  useEffect(() => {
    const initial = searchParams.get("q")?.trim() || "";
    if (allParts) return;
    setQ(initial);
    setSearched(false);
    setResults([]);
    setIntentLabel(null);
    if (initial) void runSearch(initial, facets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade, searchParams, allParts]);
  // Re-run the active search when facet filters or availability chips change.
  useEffect(() => {
    if (!searched) return;
    if (!q.trim()) return;
    void runSearch(q, facets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facets, availability]);

  return {
    q,
    setQ,
    searching,
    searched,
    setSearched,
    results,
    setResults,
    intentLabel,
    setIntentLabel,
    availability,
    setAvailability,
    runSearch,
  };
}
