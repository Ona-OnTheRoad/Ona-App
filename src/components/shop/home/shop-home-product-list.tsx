import { ShopProductCard } from "@/components/shop/product-card";
import { cn } from "@/lib/utils";
import type { ShopHomeProduct } from "./shop-home-types";

type Props = {
  items: ShopHomeProduct[];
  tint?: boolean;
  muted: string;
  cartQtyById: Record<string, number>;
  optimisticAdd: (productId: string) => void;
  optimisticRevert: (productId: string) => void;
  refreshCartCount: () => Promise<void>;
  onAdded?: () => void;
};

/** Full-width listing rows easy vertical scroll (not a grid of boxes). */
export function ShopHomeProductList({
  items,
  tint = false,
  muted,
  cartQtyById,
  optimisticAdd,
  optimisticRevert,
  refreshCartCount,
  onAdded,
}: Props) {
  return (
    <div className="flex flex-col gap-2 px-3">
      {items.length === 0 ? (
        <p className={cn("px-1 py-2 text-[12px] italic", muted)}>
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
          tint={tint}
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
