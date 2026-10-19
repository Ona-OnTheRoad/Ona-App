import { formatShopPrice } from "@/components/shop/shared/format-shop-price";
import { cn } from "@/lib/utils";
import type { Price, Variant } from "./product-sheet-types";

type Props = {
  variants: Variant[];
  selectedVariantId: string | null;
  priceFor: (variantId: string | null) => Price | undefined;
  onSelect: (variantId: string) => void;
};

export function ProductSheetOptions({
  variants,
  selectedVariantId,
  priceFor,
  onSelect,
}: Props) {
  return (
    <div className={"mt-3 border-t border-ona-border pt-3"}>
      <p className="text-[12px] font-semibold text-ona-ink">Options</p>
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
                "rounded-ona-ctl border px-2.5 py-1.5 text-left disabled:opacity-40",
                selectedVariantId === v.id
                  ? "border-ona-brand bg-ona-brand-soft"
                  : "border-ona-border bg-ona-surface",
              )}
            >
              <span className="block text-[12px] font-semibold text-ona-ink">
                {v.option_label || v.title || v.sku}
              </span>
              <span className={"block text-[11px] text-ona-muted"}>
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
