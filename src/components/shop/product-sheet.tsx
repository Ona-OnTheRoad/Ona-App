"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { CartSheet } from "@/components/shop/cart-sheet";
import { ProductSheetOptions } from "@/components/shop/product-sheet/product-sheet-options";
import { ProductSheetQuantity } from "@/components/shop/product-sheet/product-sheet-quantity";
import type { Price } from "@/components/shop/product-sheet/product-sheet-types";
import { useProductSheetData } from "@/components/shop/product-sheet/use-product-sheet-data";
import { formatShopPrice } from "@/components/shop/shared/format-shop-price";
import { shopAddToCart } from "@/lib/shop/client";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  slug: string | null;
  onClose: () => void;
};

export function ProductSheet({ slug, onClose }: Props) {
  const router = useRouter();
  const { theme, accountType, isAuthenticated } = useApp();
  const isLight = theme === "light";
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

  const muted = isLight ? "text-slate-600" : "text-white/55";
  const border = isLight ? "border-black/10" : "border-white/10";
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
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
          </div>
        ) : !product ? (
          <p className={cn("pt-6 text-center text-[13px]", muted)}>
            Product not found.
          </p>
        ) : (
          <div>
            <div
              className={cn(
                "flex h-40 items-center justify-center overflow-hidden rounded-2xl",
                isLight ? "bg-white" : "bg-black/40",
              )}
            >
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
                <ShoppingBag className="h-12 w-12 text-[#FF6B35]" />
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
                    className={cn(
                      "h-14 w-14 shrink-0 rounded-lg object-cover",
                      isLight ? "bg-white" : "bg-black/40",
                    )}
                  />
                ))}
              </div>
            ) : null}
            <h1
              id="product-sheet-title"
              className="mt-3 text-[17px] font-black leading-tight"
            >
              {String(product.name)}
            </h1>
            {product.subtitle && product.subtitle !== "Fits most vehicles" ? (
              <p className={cn("mt-1 text-[13px]", muted)}>
                {String(product.subtitle)}
              </p>
            ) : null}
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-[20px] font-black text-[#FF6B35]">{price}</p>
              {compareAt ? (
                <p
                  className={cn(
                    "text-[13px] font-semibold line-through",
                    muted,
                  )}
                >
                  {compareAt}
                </p>
              ) : null}
            </div>
            {product.description ? (
              <p className={cn("mt-2 text-[13px] leading-relaxed", muted)}>
                {String(product.description)}
              </p>
            ) : null}

            {variants.length > 1 ? (
              <ProductSheetOptions
                variants={variants}
                selectedVariantId={selectedVariantId}
                border={border}
                muted={muted}
                priceFor={priceFor}
                onSelect={(id) => {
                  setSelectedVariantId(id);
                  setMsg(null);
                }}
              />
            ) : null}

            {!outOfStock ? (
              <ProductSheetQuantity
                isLight={isLight}
                qty={qty}
                onDecrement={() => setQty((q) => clampQty(q - 1))}
                onIncrement={() => setQty((q) => clampQty(q + 1))}
              />
            ) : null}

            {msg ? (
              <p
                className={cn(
                  "mt-3 text-center text-[12px] font-semibold",
                  msg.includes("Added") ? "text-emerald-600" : "text-red-500",
                )}
              >
                {msg}
              </p>
            ) : null}

            <button
              type="button"
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
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[#FF6B35] text-[13px] font-bold text-white disabled:opacity-60"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {outOfStock ? "Out of stock" : `Add ${qty} to cart`}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                setCartOpen(true);
              }}
              className={cn(
                "mt-2 h-10 w-full rounded-xl border-0 text-[12px] font-bold",
                isLight
                  ? "bg-black/10 text-slate-900"
                  : "bg-white/10 text-white",
              )}
            >
              View cart
            </button>
          </div>
        )}
      </BottomSheet>
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
