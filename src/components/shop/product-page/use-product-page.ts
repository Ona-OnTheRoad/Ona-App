"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatShopPrice } from "@/components/shop/shared/format-shop-price";
import { shopAddToCart } from "@/lib/shop/client";
import { useApp } from "@/lib/store";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Price, ProductImage, Variant } from "./types";

export function useProductPage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const router = useRouter();
  const { accountType, isAuthenticated } = useApp();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
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

  const priceFor = useCallback(
    (variantId: string | null): Price | undefined =>
      prices.find((p) => p.variant_id === variantId),
    [prices],
  );

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );
  const selectedPrice = priceFor(selectedVariantId);
  const available = Number(selectedVariant?.stock_available ?? 0);
  const attrs =
    (product?.attributes as Record<string, unknown> | undefined) ?? {};
  const priceOnRequest = Boolean(attrs.priceOnRequest);
  const vehicleTags = Array.isArray(attrs.vehicleTags)
    ? (attrs.vehicleTags as unknown[]).map(String)
    : [];
  const outOfStock = !selectedVariant || available <= 0;

  const clampQty = useCallback(
    (n: number) => {
      const max = Math.max(1, Math.min(99, available));
      return Math.max(1, Math.min(max, n));
    },
    [available],
  );

  useEffect(() => {
    if (!selectedVariantId) return;
    setQty((q) => (available > 0 ? clampQty(q) : 1));
  }, [selectedVariantId, available, clampQty]);

  const price = priceOnRequest
    ? "Contact for price"
    : selectedPrice
      ? formatShopPrice(selectedPrice.amount_minor)
      : "";
  const compareAt = selectedPrice?.compare_at_minor
    ? formatShopPrice(selectedPrice.compare_at_minor)
    : null;

  const addToCart = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await shopAddToCart({
        variantId: selectedVariant.id,
        qty,
        accountContext:
          accountType === "professional" ? "professional" : "motorist",
      });
      toastSuccess("Added to cart");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Could not add");
    } finally {
      setAdding(false);
    }
  };

  return {
    loading,
    product,
    variants,
    images,
    selectedVariantId,
    setSelectedVariantId,
    qty,
    setQty,
    adding,
    priceFor,
    selectedVariant,
    priceOnRequest,
    vehicleTags,
    outOfStock,
    clampQty,
    price,
    compareAt,
    addToCart,
  };
}
