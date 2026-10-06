import { useEffect, useState } from "react";
import type { FacetCategory, FilterDef } from "./facet-bar-types";

export function useFacetDefs(tradeKey: string) {
  const [defs, setDefs] = useState<FilterDef[]>([]);
  const [cats, setCats] = useState<FacetCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [fRes, cRes] = await Promise.all([
          fetch(`/api/shop/filters?trade=${encodeURIComponent(tradeKey)}`),
          fetch(
            `/api/shop/categories?trade=${encodeURIComponent(tradeKey)}&roots=1`,
          ),
        ]);
        const fJson = (await fRes.json()) as {
          ok?: boolean;
          data?: { filters?: FilterDef[] | { filters?: FilterDef[] } };
        };
        const cJson = (await cRes.json()) as {
          ok?: boolean;
          data?: { categories?: FacetCategory[] };
        };
        if (!cancelled) {
          const raw = fJson.data?.filters;
          const list = Array.isArray(raw)
            ? raw
            : raw && typeof raw === "object" && Array.isArray(raw.filters)
              ? raw.filters
              : [];
          setDefs(list);
          setCats(
            Array.isArray(cJson.data?.categories) ? cJson.data.categories : [],
          );
        }
      } catch {
        if (!cancelled) {
          setDefs([]);
          setCats([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tradeKey]);

  return { defs, cats };
}
