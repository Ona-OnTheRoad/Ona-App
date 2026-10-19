"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { CartSheet } from "@/components/shop/cart-sheet";
import { ProductSheetOptions } from "@/components/shop/product-sheet/product-sheet-options";
import { ProductSheetQuantity } from "@/components/shop/product-sheet/product-sheet-quantity";
import type { Price } from "@/components/shop/product-sheet/product-sheet-types";
import { useProductSheetData } from "@/components/shop/product-sheet/use-product-sheet-data";
import { formatShopPrice } from "@/components/shop/shared/format-shop-price";
import { shopAddToCart } from "@/lib/shop/client";
import { useApp } from "@/lib/store";

type Props = {
  slug: string | null;
  onClose: () => void;
};

export function ProductSheet({ slug, onClose }: Props) {
  const router = useRouter();
  const { accountType, isAuthenticated } = useApp();
  const {
    loading,
    product,
    variants,
    prices,
    images,
    selectedVariantId,
    setSelectedVariantId,
    qty,
    setQty,
    msg,
    setMsg,
  } = useProductSheetData(slug, accountType);
  const [adding, setAdding] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const open = Boolean(slug);

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
  }, [selectedVariantId, available, clampQty, setQty]);

  const price = selectedPrice
    ? formatShopPrice(selectedPrice.amount_minor)
    : "";
  const compareAt = selectedPrice?.compare_at_minor
    ? formatShopPrice(selectedPrice.compare_at_minor)
    : null;

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        titleId="product-sheet-title"
        heightPercent={55}
        growToPercent={82}
        surface="ona"
        className="ona2"
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-ona-brand-ink" />
          </div>
        ) : !product ? (
          <p className="pt-6 text-center text-[13px] text-ona-muted">
            Product not found.
          </p>
        ) : (
          <div>
            <div className="flex h-40 items-center justify-center overflow-hidden rounded-ona-card bg-ona-field">
              {images[0]?.url || product.primary_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  loading="lazy"
                  decoding="async"
                  src={String(images[0]?.url || product.primary_image_url)}
                  alt={String(product.name)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag aria-hidden className="h-12 w-12 text-ona-muted" />
              )}
            </div>
            {images.length > 1 ? (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    loading="lazy"
                    decoding="async"
                    key={`${img.url}-${i}`}
                    src={img.url}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-ona-ctl bg-ona-field object-cover"
                  />
                ))}
              </div>
            ) : null}
            <h1
              id="product-sheet-title"
              className="mt-3 text-[16px] font-semibold leading-tight text-ona-ink"
            >
              {String(product.name)}
            </h1>
            {product.subtitle && product.subtitle !== "Fits most vehicles" ? (
              <p className="mt-1 text-[13px] text-ona-muted">
                {String(product.subtitle)}
              </p>
            ) : null}
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-[18px] font-semibold tabular-nums text-ona-brand-ink">
                {price}
              </p>
              {compareAt ? (
                <p className="text-[13px] font-semibold text-ona-muted line-through">
                  {compareAt}
                </p>
              ) : null}
            </div>
            {product.description ? (
              <p className="mt-2 text-[13px] leading-relaxed text-ona-muted">
                {String(product.description)}
              </p>
            ) : null}

            {variants.length > 1 ? (
              <ProductSheetOptions
                variants={variants}
                selectedVariantId={selectedVariantId}
                priceFor={priceFor}
                onSelect={(id) => {
                  setSelectedVariantId(id);
                  setMsg(null);
                }}
              />
            ) : null}

            {!outOfStock ? (
              <ProductSheetQuantity
                qty={qty}
                onDecrement={() => setQty((q) => clampQty(q - 1))}
                onIncrement={() => setQty((q) => clampQty(q + 1))}
              />
            ) : null}

            {msg ? (
              <p
                role="status"
                className={
                  msg.includes("Added")
                    ? "mt-3 text-center text-[12px] font-semibold text-ona-success"
                    : "mt-3 text-center text-[12px] font-semibold text-ona-danger"
                }
              >
                {msg}
              </p>
            ) : null}

            <Button
              variant="ona"
              size="ona"
              className="mt-3"
              disabled={adding || outOfStock}
              onClick={async () => {
                if (!isAuthenticated) {
                  onClose();
                  router.push("/login");
                  return;
                }
                if (!selectedVariant) return;
                setAdding(true);
                setMsg(null);
                try {
                  await shopAddToCart({
                    variantId: selectedVariant.id,
                    qty,
                    accountContext:
                      accountType === "professional"
                        ? "professional"
                        : "motorist",
                  });
                  setMsg("Added to cart");
                } catch (e) {
                  setMsg(e instanceof Error ? e.message : "Could not add");
                } finally {
                  setAdding(false);
                }
              }}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {outOfStock ? "Out of stock" : `Add ${qty} to cart`}
            </Button>
            <Button
              variant="onaOutline"
              size="ona"
              className="mt-2"
              onClick={() => {
                onClose();
                setCartOpen(true);
              }}
            >
              View cart
            </Button>
          </div>
        )}
      </BottomSheet>
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
