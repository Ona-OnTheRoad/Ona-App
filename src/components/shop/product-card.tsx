"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, Plus, ShoppingBag } from "lucide-react";
import { ProductSheet } from "@/components/shop/product-sheet";
import { detectCurrency, formatMoney, fromMinorUnits } from "@/lib/pricing";
import { shopAddToCart } from "@/lib/shop/client";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export type ShopCardProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  fromPriceMinor: number | null;
  inStock: boolean;
  primaryImageUrl?: string | null;
  defaultVariantId?: string | null;
  fitmentBadge?: string | null;
  fitmentStatus?: string | null;
  tradeKey?: string | null;
  vehicleTags?: string[];
  priceOnRequest?: boolean;
  stockLabel?: string;
  /** Exact sellable quantity from the backend */
  stockQty?: number;
};

type Props = {
  product: ShopCardProduct;
  qty?: number;
  onAdded?: () => void;
  /** Live quantity of this product already in the cart (drives the pill) */
  cartQty?: number;
  /** Fire immediately on tap for instant UI (server sync happens outside) */
  onOptimisticAdd?: () => void;
  /** Called if the background add fails so the optimistic UI can revert */
  onOptimisticRevert?: () => void;
  /** Narrow card for horizontal rows (New arrivals). */
  compact?: boolean;
};

function formatPrice(minor: number | null, priceOnRequest?: boolean): string {
  if (priceOnRequest) return "Contact for price";
  if (minor == null) return "";
  return formatMoney(fromMinorUnits(minor, "NGN"), detectCurrency());
}

function fitmentBadge(
  status?: string | null,
  badge?: string | null,
): string | null {
  if (badge) return badge;
  if (!status || status === "unknown") return null;
  if (status === "direct_fit") return "Fits your vehicle";
  if (status === "compatible") return "Compatible";
  if (status === "conditional") return "Check fit";
  return null;
}

/** Compact market-style row: image left, name/price, "+" add button at far right. */
export function ShopProductCard({
  product,
  qty = 1,
  onAdded,
  cartQty,
  onOptimisticAdd,
  onOptimisticRevert,
  compact = false,
}: Props) {
  const { isAuthenticated, accountType } = useApp();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [addFailed, setAddFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const inStock = Boolean(product.inStock);
  const canAdd =
    inStock && Boolean(product.defaultVariantId) && !product.priceOnRequest;
  const stockLabel =
    product.stockLabel || (inStock ? "In Stock" : "Out of Stock");
  const badge = fitmentBadge(product.fitmentStatus, product.fitmentBadge);

  const addToCart = async () => {
    if (!isAuthenticated) {
      setSheetOpen(true);
      return;
    }
    if (!product.defaultVariantId || adding) return;
    setAdding(true);
    setAddFailed(false);
    onOptimisticAdd?.();
    try {
      const res = await shopAddToCart({
        variantId: product.defaultVariantId,
        qty,
        accountContext:
          accountType === "professional" ? "professional" : "motorist",
      });
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1500);
      onAdded?.();
      void res;
    } catch {
      onOptimisticRevert?.();
      setAddFailed(true);
      window.setTimeout(() => setAddFailed(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSheetOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSheetOpen(true);
          }
        }}
        className={cn(
          "relative flex cursor-pointer items-center gap-3 rounded-ona-card border border-ona-border bg-ona-surface p-2.5 text-left text-ona-ink",
          compact ? "w-[270px] shrink-0" : "w-full",
        )}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-ona-ctl bg-ona-field">
          {product.primaryImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              loading="lazy"
              decoding="async"
              src={product.primaryImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <ShoppingBag aria-hidden className="h-5 w-5 text-ona-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[12px] font-semibold leading-snug">
            {typeof cartQty === "number" && cartQty > 0 ? (
              <span className="mr-1.5 text-ona-muted">x{cartQty}</span>
            ) : null}
            {product.name}
          </p>
          {product.subtitle && product.subtitle !== "Fits most vehicles" ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-ona-muted">
              {product.subtitle}
            </p>
          ) : null}
          {product.vehicleTags && product.vehicleTags.length > 0 ? (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {product.vehicleTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-ona-field px-1.5 py-px text-[9px] font-semibold text-ona-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {badge ? (
            <p className="mt-0.5 text-[10px] font-semibold text-ona-success">
              {badge}
            </p>
          ) : null}
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[12px] font-semibold tabular-nums">
              {formatPrice(product.fromPriceMinor, product.priceOnRequest)}
            </p>
            <Badge
              variant="matched"
              className={cn(
                "px-1.5 py-px text-[9px] normal-case",
                !inStock && "bg-ona-field text-ona-muted",
              )}
            >
              {stockLabel}
            </Badge>
          </div>
        </div>

        <button
          type="button"
          aria-label={canAdd ? "Add to cart" : "Out of stock"}
          disabled={!canAdd || adding}
          onClick={(e) => {
            e.stopPropagation();
            void addToCart();
          }}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-transparent transition-colors active:bg-ona-field",
            justAdded
              ? "text-ona-success"
              : addFailed
                ? "text-ona-danger"
                : canAdd
                  ? "text-ona-brand-ink"
                  : "text-ona-disabled-ink disabled:opacity-60",
          )}
          title={
            justAdded
              ? "Added to cart"
              : addFailed
                ? "Could not add, tap again or reload"
                : canAdd
                  ? "Add to cart"
                  : "Out of stock"
          }
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin [animation-duration:0.6s]" />
          ) : justAdded ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : addFailed ? (
            <AlertCircle className="h-4 w-4" strokeWidth={2.6} />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2.6} />
          )}
        </button>
      </div>

      {justAdded ? (
        <div
          role="status"
          className="fixed left-1/2 top-2.5 z-[9999] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ona-dark px-4 py-2 text-[12px] font-semibold text-ona-on-dark shadow-lg"
        >
          <Check className="h-3.5 w-3.5 text-ona-success" strokeWidth={3} />
          Added to cart
        </div>
      ) : null}
      <ProductSheet
        slug={sheetOpen ? product.slug : null}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
