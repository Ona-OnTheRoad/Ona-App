import { ShopProductCard } from "@/components/shop/product-card";
import type { TradeProductCard } from "./trade-page-types";

type Props = {
  items: TradeProductCard[];
  cartQtyById: Record<string, number>;
  optimisticAdd: (productId: string) => void;
  optimisticRevert: () => void;
};

export function TradeProductRows({
  items,
  cartQtyById,
  optimisticAdd,
  optimisticRevert,
}: Props) {
  return (
    <div className="flex flex-col gap-3 px-3 pb-4">
      {items.map((p) => (
        <ShopProductCard
          key={p.id}
          tint
          cartQty={cartQtyById[p.id]}
          onOptimisticAdd={() => optimisticAdd(p.id)}
          onOptimisticRevert={optimisticRevert}
          product={{
            id: p.id,
            slug: p.slug,
            name: p.name,
            subtitle: p.subtitle,
            fromPriceMinor: p.fromPriceMinor,
            inStock: p.inStock,
            fitmentStatus: p.fitmentStatus,
            fitmentBadge: p.fitmentBadge,
            defaultVariantId: p.defaultVariantId,
            vehicleTags: p.vehicleTags,
            priceOnRequest: p.priceOnRequest,
            stockLabel: p.stockLabel,
          }}
        />
      ))}
    </div>
  );
}
