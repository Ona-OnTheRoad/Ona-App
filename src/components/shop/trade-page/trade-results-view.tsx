import { Loader2, ShoppingBag } from "lucide-react";
import { ShopAvailabilityChips } from "@/components/shop/shop-availability-chips";
import type { ListingFilterKey } from "@/lib/shop/listing-status";
import { cn } from "@/lib/utils";
import { TradeProductRows } from "./trade-product-rows";
import type { TradeProductCard, TradeTone } from "./trade-page-types";

type Props = {
  tone: TradeTone;
  label: string;
  searching: boolean;
  visibleResults: TradeProductCard[];
  intentLabel: string | null;
  availability: ListingFilterKey;
  setAvailability: (v: ListingFilterKey) => void;
  onClear: () => void;
  cartQtyById: Record<string, number>;
  optimisticAdd: (productId: string) => void;
  optimisticRevert: () => void;
};

export function TradeResultsView({
  tone,
  label,
  searching,
  visibleResults,
  intentLabel,
  availability,
  setAvailability,
  onClear,
  cartQtyById,
  optimisticAdd,
  optimisticRevert,
}: Props) {
  const { accentText, muted } = tone;
  if (searching) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className={`h-8 w-8 animate-spin ${accentText}`} />
      </div>
    );
  }
  if ((visibleResults ?? []).length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <ShopAvailabilityChips
          value={availability}
          onChange={setAvailability}
        />
        <ShoppingBag className={`mx-auto h-9 w-9 ${accentText}`} />
        <p className={cn("mt-2 text-[13px]", muted)}>No matches in {label}.</p>
      </div>
    );
  }
  return (
    <>
      <div className="flex items-center justify-between px-3 py-3">
        <p className="text-[13px] font-bold">{intentLabel || "Results"}</p>
        <button
          type="button"
          className={`border-0 bg-transparent text-[12px] font-semibold ${accentText}`}
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <ShopAvailabilityChips value={availability} onChange={setAvailability} />
      <TradeProductRows
        items={visibleResults}
        cartQtyById={cartQtyById}
        optimisticAdd={optimisticAdd}
        optimisticRevert={optimisticRevert}
      />
    </>
  );
}
