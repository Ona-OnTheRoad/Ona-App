import { useCallback, useEffect, useState } from "react";
import { AUTOMEDICS_CATEGORIES } from "@/lib/shop/automedics-catalog";
import type { ListingFilterKey } from "@/lib/shop/listing-status";
import type { BrowseCat, TradeProductCard } from "./trade-page-types";

type Args = {
  trade: string;
  ctx: string;
  allParts: boolean;
  catQuery: string;
  catMetaName: string | undefined;
  availability: ListingFilterKey;
  searched: boolean;
};

/** Neutral browse (no vehicle) category > subcategory > product listing rows. */
export function useTradeBrowse({
  trade,
  ctx,
  allParts,
  catQuery,
  catMetaName,
  availability,
  searched,
}: Args) {
  const [browseStack, setBrowseStack] = useState<BrowseCat[]>([]);
  const [browseLevel, setBrowseLevel] = useState<BrowseCat[]>([]);
  const [browseProducts, setBrowseProducts] = useState<
    TradeProductCard[] | null
  >(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState(false);

  /** Load a neutral browse level children of `parent`, else roots. */
  const loadBrowse = useCallback(
    async (parent?: BrowseCat) => {
      setBrowseLoading(true);
      setBrowseError(false);
      setBrowseProducts(null);
      try {
        const qs = new URLSearchParams({ trade });
        if (parent) qs.set("parent", parent.id);
        else qs.set("start", "1");
        const res = await fetch(`/api/shop/categories?${qs.toString()}`);
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { categories?: BrowseCat[] };
        };
        if (json.ok) {
          let list = Array.isArray(json.data?.categories)
            ? json.data.categories
            : [];
          if (trade === "mechanic" && !parent) {
            const order = AUTOMEDICS_CATEGORIES.map((c) => c.slug as string);
            list = [...list].sort((a, b) => {
              const ia = order.indexOf(a.slug);
              const ib = order.indexOf(b.slug);
              return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
            });
          }
          setBrowseLevel(list);
        } else {
          setBrowseError(true);
        }
      } catch {
        setBrowseError(true);
      } finally {
        setBrowseLoading(false);
      }
    },
    [trade],
  );

  /** Show products for a selected category row (leaf of the browse tree). */
  const openBrowseCategory = useCallback(
    async (cat: BrowseCat) => {
      setBrowseLoading(true);
      setBrowseProducts(null);
      try {
        const qs = new URLSearchParams({
          trade,
          category: cat.slug,
          limit: "250",
          ctx,
        });
        if (availability !== "all") qs.set("listingStatus", availability);
        const res = await fetch(`/api/shop/products?${qs.toString()}`);
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { products?: TradeProductCard[] };
        };
        if (json.ok) {
          setBrowseProducts(json.data?.products ?? []);
          setBrowseLevel([]);
        } else {
          setBrowseProducts([]);
        }
      } catch {
        setBrowseProducts([]);
      } finally {
        setBrowseLoading(false);
      }
    },
    [trade, ctx, availability],
  );

  /** Drill into a category row: children level if present, else its products. */
  const drillBrowse = useCallback(
    async (cat: BrowseCat) => {
      setBrowseLoading(true);
      setBrowseError(false);
      setBrowseProducts(null);
      try {
        const qs = new URLSearchParams({ trade, parent: cat.id });
        const res = await fetch(`/api/shop/categories?${qs.toString()}`);
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { categories?: BrowseCat[] };
        };
        const children = Array.isArray(json.data?.categories)
          ? json.data.categories
          : [];
        if (children.length > 0) {
          setBrowseStack((s) => [...s, cat]);
          setBrowseLevel(children);
        } else {
          setBrowseStack((s) => [...s, cat]);
          await openBrowseCategory(cat);
        }
      } catch {
        setBrowseError(true);
      } finally {
        setBrowseLoading(false);
      }
    },
    [trade, openBrowseCategory],
  );

  /** Pop back one level (or to roots) when a breadcrumb is tapped. */
  const popBrowse = useCallback(
    async (keep?: BrowseCat) => {
      setBrowseProducts(null);
      if (!keep) {
        setBrowseStack([]);
        void loadBrowse();
        return;
      }
      const next = browseStack.filter((c) => c.id !== keep.id);
      setBrowseStack(next);
      const parent = next[next.length - 1];
      void loadBrowse(parent);
    },
    [browseStack, loadBrowse],
  );

  // Deep-link a category (?cat=batteries or /shop/c/batteries).
  useEffect(() => {
    if (allParts) return;
    if (!catQuery) return;
    void openBrowseCategory({
      id: catQuery,
      slug: catQuery,
      name: catMetaName || catQuery,
      depth: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allParts, catQuery, trade]);

  // Seed the neutral browse with root categories on first load (non-ALL PARTS).
  const browseSeeded = browseStack.length > 0 || browseLevel.length > 0;
  useEffect(() => {
    if (allParts) return;
    if (catQuery) return;
    if (browseSeeded) return;
    void loadBrowse();
  }, [allParts, browseSeeded, loadBrowse, catQuery]);

  // Reset the neutral browse when switching trades or entering ALL PARTS.
  useEffect(() => {
    setBrowseStack([]);
    setBrowseProducts(null);
    setBrowseLevel([]);
  }, [trade, allParts]);

  // When the availability chip changes while a category's products are open,
  // re-pull that list so the chips act as a product filter (chips only apply
  // to products, not to category/subcategory rows).
  useEffect(() => {
    if (searched) return;
    if (browseProducts === null) return;
    if (browseStack.length === 0) return;
    void openBrowseCategory(browseStack[browseStack.length - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability]);

  return {
    browseStack,
    browseLevel,
    browseProducts,
    browseLoading,
    browseError,
    drillBrowse,
    popBrowse,
  };
}
