import { formatShopPrice } from "@/components/shop/shared/format-shop-price";
import { cn } from "@/lib/utils";
import type { Price, Variant } from "./product-sheet-types";

type Props = {
  variants: Variant[];
  selectedVariantId: string | null;
  border: string;
  muted: string;
  priceFor: (variantId: string | null) => Price | undefined;
  onSelect: (variantId: string) => void;
};

export function ProductSheetOptions({
  variants,
  selectedVariantId,
  border,
  muted,
  priceFor,
  onSelect,
}: Props) {
  return (
    <div className={cn("mt-3 border-t pt-3", border)}>
      <p className="text-[12px] font-bold">Options</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {variants.map((v) => {
          const vAvail = Number(v.stock_available ?? 0);
          const vPrice = priceFor(v.id);
          const soldOut = vAvail <= 0;
          return (
            <button
              key={v.id}
              type="button"
              disabled={soldOut}
              onClick={() => onSelect(v.id)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-left disabled:opacity-40",
                selectedVariantId === v.id
                  ? "border-[#FF6B35] bg-[#FF6B35]/10"
                  : border,
              )}
            >
              <span className="block text-[12px] font-bold">
                {v.option_label || v.title || v.sku}
              </span>
              <span className={cn("block text-[11px]", muted)}>
                {vPrice ? formatShopPrice(vPrice.amount_minor) : ""}
                {soldOut ? " · Sold out" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
