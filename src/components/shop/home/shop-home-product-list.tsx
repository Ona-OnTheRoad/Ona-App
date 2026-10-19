import { ShopProductCard } from "@/components/shop/product-card";
import type { ShopHomeProduct } from "./shop-home-types";

type Props = {
  items: ShopHomeProduct[];
  /** Horizontal scrolling row (New arrivals) instead of a vertical list. */
  horizontal?: boolean;
  cartQtyById: Record<string, number>;
  optimisticAdd: (productId: string) => void;
  optimisticRevert: (productId: string) => void;
  refreshCartCount: () => Promise<void>;
  onAdded?: () => void;
};

/** Listing rows (vertical) or a horizontal scroll row. */
export function ShopHomeProductList({
  items,
  horizontal = false,
  cartQtyById,
  optimisticAdd,
  optimisticRevert,
  refreshCartCount,
  onAdded,
}: Props) {
  return (
    <div
      className={
        horizontal
          ? "-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-hide"
          : "flex flex-col gap-2"
      }
    >
      {items.length === 0 ? (
        <p className="px-1 py-2 text-[12px] italic text-ona-muted">
          Nothing here matches the filter.
        </p>
      ) : null}
      {items.map((p) => (
        <ShopProductCard
          key={p.id}
          product={{
            id: p.id,
            slug: p.slug,
            name: p.name,
            subtitle: p.subtitle,
            fromPriceMinor: p.fromPriceMinor,
            inStock: p.inStock,
            primaryImageUrl: p.primaryImageUrl,
            defaultVariantId: p.defaultVariantId,
            vehicleTags: p.vehicleTags,
            priceOnRequest: p.priceOnRequest,
            stockLabel: p.stockLabel,
          }}
          compact={horizontal}
          cartQty={cartQtyById[p.id]}
          onOptimisticAdd={() => optimisticAdd(p.id)}
          onOptimisticRevert={() => optimisticRevert(p.id)}
          onAdded={() => {
            void refreshCartCount();
            onAdded?.();
          }}
        />
      ))}
    </div>
  );
}
