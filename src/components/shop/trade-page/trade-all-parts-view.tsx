import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TradeProductRows } from "./trade-product-rows";
import type {
  AllPartsCat,
  TradeProductCard,
  TradeTone,
} from "./trade-page-types";

type Props = {
  tone: TradeTone;
  vehicleLabel: string | null;
  partsLoading: boolean;
  cats: AllPartsCat[];
  categoryId: string | null;
  setCategoryId: (id: string | null) => void;
  partsProducts: TradeProductCard[];
  cartQtyById: Record<string, number>;
  optimisticAdd: (productId: string) => void;
  optimisticRevert: () => void;
};

export function TradeAllPartsView({
  tone,
  vehicleLabel,
  partsLoading,
  cats,
  categoryId,
  setCategoryId,
  partsProducts,
  cartQtyById,
  optimisticAdd,
  optimisticRevert,
}: Props) {
  const { isLight, accentText, card, muted } = tone;
  return (
    <>
      {vehicleLabel ? (
        <p className={`px-3 pt-2 text-[12px] font-bold ${accentText}`}>
          {vehicleLabel}
        </p>
      ) : (
        <p className={cn("px-3 pt-2 text-[12px]", muted)}>
          Select a vehicle to see systems with products.
        </p>
      )}
      {partsLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className={`h-8 w-8 animate-spin ${accentText}`} />
        </div>
      ) : (
        <>
          {/* Category tree only non-empty */}
          {!categoryId && cats.length > 0 ? (
            <>
              <p className="px-3 pt-3 pb-2 text-[13px] font-black">Systems</p>
              <div className="flex flex-col gap-1.5 px-3">
                {cats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border-0 px-3 py-2.5 text-left",
                      card,
                      isLight ? "text-slate-900" : "text-white",
                    )}
                  >
                    <span className="text-[13px] font-bold">{c.name}</span>
                    <span className={cn("text-[11px] font-semibold", muted)}>
                      {c.productCount}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {categoryId ? (
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-[13px] font-bold">
                {cats.find((c) => c.id === categoryId)?.name || "Parts"}
              </p>
              <button
                type="button"
                className={`border-0 bg-transparent text-[12px] font-semibold ${accentText}`}
                onClick={() => setCategoryId(null)}
              >
                All systems
              </button>
            </div>
          ) : null}
          <p className="px-3 pt-3 pb-2 text-[13px] font-black">
            {categoryId ? "Products" : "Featured for this vehicle"}
          </p>
          {partsProducts.length === 0 ? (
            <p className={cn("px-4 text-[13px]", muted)}>
              No products in catalog for this selection yet.
            </p>
          ) : (
            <TradeProductRows
              items={partsProducts}
              cartQtyById={cartQtyById}
              optimisticAdd={optimisticAdd}
              optimisticRevert={optimisticRevert}
            />
          )}
        </>
      )}
    </>
  );
}
