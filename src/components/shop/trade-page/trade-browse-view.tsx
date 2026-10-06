import { ArrowLeft, Loader2 } from "lucide-react";
import { ShopAvailabilityChips } from "@/components/shop/shop-availability-chips";
import type { ListingFilterKey } from "@/lib/shop/listing-status";
import { cn } from "@/lib/utils";
import { TradeProductRows } from "./trade-product-rows";
import type {
  BrowseCat,
  TradeProductCard,
  TradeTone,
} from "./trade-page-types";

type Props = {
  tone: TradeTone;
  trade: string;
  browseStack: BrowseCat[];
  browseLevel: BrowseCat[];
  browseProducts: TradeProductCard[] | null;
  visibleBrowse: TradeProductCard[] | null;
  browseLoading: boolean;
  browseError: boolean;
  availability: ListingFilterKey;
  setAvailability: (v: ListingFilterKey) => void;
  popBrowse: (keep?: BrowseCat) => Promise<void>;
  drillBrowse: (cat: BrowseCat) => Promise<void>;
  cartQtyById: Record<string, number>;
  optimisticAdd: (productId: string) => void;
  optimisticRevert: () => void;
};

export function TradeBrowseView({
  tone,
  trade,
  browseStack,
  browseLevel,
  browseProducts,
  visibleBrowse,
  browseLoading,
  browseError,
  availability,
  setAvailability,
  popBrowse,
  drillBrowse,
  cartQtyById,
  optimisticAdd,
  optimisticRevert,
}: Props) {
  const { isLight, accentText, card, muted } = tone;
  return (
    <div className="px-3 pt-3">
      {/* Breadcrumb back when browsing deeper than roots */}
      {browseStack.length > 0 ? (
        <div className="mb-2 flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            className={`shrink-0 border-0 bg-transparent text-[12px] font-bold ${accentText}`}
            onClick={() => void popBrowse()}
          >
            All categories
          </button>
          {browseStack.map((c) => (
            <button
              key={c.id}
              type="button"
              className="shrink-0 border-0 bg-transparent text-[12px] font-semibold"
              onClick={() => void popBrowse(c)}
            >
              <span className={muted}>/ {c.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      {browseLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className={`h-7 w-7 animate-spin ${accentText}`} />
        </div>
      ) : browseError ? (
        <p className={cn("px-1 py-10 text-center text-[13px]", muted)}>
          Could not load categories.
        </p>
      ) : browseProducts ? (
        <>
          <div className="flex items-center justify-between pb-2">
            <p className="text-[13px] font-bold">
              {browseStack.length
                ? browseStack[browseStack.length - 1].name
                : "Products"}
            </p>
            <button
              type="button"
              aria-label="Back to categories"
              className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent active:bg-black/[0.06]"
              onClick={() => void popBrowse()}
            >
              <ArrowLeft className={`h-[18px] w-[18px] ${accentText}`} />
            </button>
          </div>
          <ShopAvailabilityChips
            value={availability}
            onChange={setAvailability}
          />
          {!visibleBrowse || visibleBrowse.length === 0 ? (
            <p className={cn("px-1 py-8 text-center text-[13px]", muted)}>
              No products in this category yet.
            </p>
          ) : (
            <TradeProductRows
              items={visibleBrowse}
              cartQtyById={cartQtyById}
              optimisticAdd={optimisticAdd}
              optimisticRevert={optimisticRevert}
            />
          )}
        </>
      ) : (
        <>
          <p className="pb-2 text-[13px] font-black">
            {browseStack.length
              ? browseStack[browseStack.length - 1].name
              : trade === "mechanic"
                ? "Categories"
                : "My Shop"}
          </p>
          {browseLevel.length === 0 ? (
            <p className={cn("px-1 py-10 text-center text-[13px]", muted)}>
              No categories available yet.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {browseLevel.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void drillBrowse(c)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left",
                    card,
                    isLight ? "text-slate-900" : "text-white",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                    {c.name}
                  </span>
                  {typeof c.productCount === "number" && c.productCount > 0 ? (
                    <span
                      className={cn(
                        "shrink-0 text-[11px] font-semibold",
                        muted,
                      )}
                    >
                      {c.productCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
