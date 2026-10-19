"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProductMedia } from "@/components/shop/product-page/product-media";
import { QuantitySelector } from "@/components/shop/product-page/quantity-selector";
import { useProductPage } from "@/components/shop/product-page/use-product-page";
import { VariantOptions } from "@/components/shop/product-page/variant-options";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ShopProductPage() {
  const router = useRouter();
  const { theme } = useApp();
  const isLight = theme === "light";
  const p = useProductPage();
  const { product, selectedVariant, outOfStock, priceOnRequest } = p;

  const bg = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const muted = isLight ? "text-slate-600" : "text-white/55";
  const border = isLight ? "border-black/10" : "border-white/10";

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", bg)}>
      <PageHeader
        title={product ? String(product.name) : "Product"}
        backHref="/shop"
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8 pt-2">
        {p.loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
          </div>
        ) : !product ? (
          <p className={cn("text-center text-[13px]", muted)}>
            Product not found.
          </p>
        ) : (
          <>
            <ProductMedia
              isLight={isLight}
              product={product}
              images={p.images}
            />
            <h1 className="mt-3 text-[18px] font-black leading-tight">
              {String(product.name)}
            </h1>
            {product.subtitle ? (
              <p className={cn("mt-1 text-[13px]", muted)}>
                {String(product.subtitle)}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="text-[22px] font-black text-[#FF6B35]">{p.price}</p>
              {p.compareAt && !priceOnRequest ? (
                <p
                  className={cn(
                    "text-[13px] font-semibold line-through",
                    muted,
                  )}
                >
                  {p.compareAt}
                </p>
              ) : null}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold",
                  outOfStock
                    ? isLight
                      ? "bg-black/10 text-slate-500"
                      : "bg-white/10 text-white/55"
                    : "bg-emerald-500/15 text-emerald-700",
                )}
              >
                {outOfStock ? "Out of Stock" : "In Stock"}
              </span>
            </div>
            {p.vehicleTags.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.vehicleTags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      isLight
                        ? "bg-black/8 text-slate-700"
                        : "bg-white/10 text-white/80",
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {product.description ? (
              <p className={cn("mt-3 text-[13px] leading-relaxed", muted)}>
                {String(product.description)}
              </p>
            ) : null}

            {/* Variant selector */}
            {p.variants.length > 1 ? (
              <VariantOptions
                variants={p.variants}
                priceFor={p.priceFor}
                selectedVariantId={p.selectedVariantId}
                onSelect={(id) => {
                  p.setSelectedVariantId(id);
                }}
                muted={muted}
                border={border}
              />
            ) : null}

            {selectedVariant ? (
              <p className={cn("mt-2 text-[11px] font-semibold", muted)}>
                SKU {selectedVariant.sku}
                {selectedVariant.oem_number
                  ? ` · OEM ${String(selectedVariant.oem_number)}`
                  : ""}
                {selectedVariant.mpn
                  ? ` · MPN ${String(selectedVariant.mpn)}`
                  : ""}
              </p>
            ) : null}

            {/* Quantity selector */}
            {!outOfStock && !priceOnRequest ? (
              <QuantitySelector
                isLight={isLight}
                qty={p.qty}
                setQty={p.setQty}
                clampQty={p.clampQty}
              />
            ) : null}

            <button
              type="button"
              disabled={p.adding || outOfStock || priceOnRequest}
              onClick={() => void p.addToCart()}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[#FF6B35] text-[14px] font-bold text-white disabled:opacity-60"
            >
              {p.adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {priceOnRequest
                ? "Contact for price"
                : outOfStock
                  ? "Out of Stock"
                  : `Add ${p.qty} to cart`}
            </button>
            <button
              type="button"
              onClick={() => router.push("/shop/cart")}
              className={cn(
                "mt-2 h-11 w-full rounded-xl border-0 text-[13px] font-bold",
                isLight
                  ? "bg-black/10 text-slate-900"
                  : "bg-white/10 text-white",
              )}
            >
              View cart
            </button>
          </>
        )}
      </div>
    </div>
  );
}
