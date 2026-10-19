import { useEffect, useState } from "react";
import type { Price, ProductImage, Variant } from "./product-sheet-types";

/** Loads a product by slug; selection/qty/msg state is reset on each load. */
export function useProductSheetData(
  slug: string | null,
  accountType: string | null | undefined,
) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setQty(1);
      setProduct(null);
      setVariants([]);
      setPrices([]);
      setImages([]);
      setSelectedVariantId(null);
      try {
        const res = await fetch(
          `/api/shop/products/${encodeURIComponent(slug)}?ctx=${encodeURIComponent(
            accountType === "professional" ? "professional" : "motorist",
          )}`,
        );
        const json = (await res.json()) as {
          ok?: boolean;
          data?: {
            product?: Record<string, unknown>;
            variants?: Variant[];
            prices?: Price[];
            images?: ProductImage[];
          };
        };
        if (!cancelled && json.ok && json.data) {
          setProduct(json.data.product ?? null);
          setVariants(json.data.variants ?? []);
          setPrices(json.data.prices ?? []);
          setImages(json.data.images ?? []);
          const first = json.data.variants?.find(
            (v) => Number(v.stock_available ?? 0) > 0,
          )?.id;
          setSelectedVariantId((first ?? json.data.variants?.[0]?.id) || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, accountType]);

  return {
    loading,
    product,
    variants,
    prices,
    images,
    selectedVariantId,
    setSelectedVariantId,
    qty,
    setQty,
  };
}
