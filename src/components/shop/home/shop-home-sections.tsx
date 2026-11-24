import { onaEyebrowClass } from "@/components/ui/ona-field";
import { PRO_TRADE_OPTIONS } from "@/lib/services";
import { ShopHomeProductList } from "./shop-home-product-list";
import type { ShopHomeProduct } from "./shop-home-types";

type Props = {
  allowedTradeKeys: string[] | null;
  popular: ShopHomeProduct[];
  newArrivals: ShopHomeProduct[];
  onEnterTrade: (tradeId: string) => void;
  refreshCartCount: () => Promise<void>;
  listProps: Omit<
    React.ComponentProps<typeof ShopHomeProductList>,
    "items" | "horizontal" | "onAdded"
  >;
};

export function ShopHomeSections({
  allowedTradeKeys,
  popular,
  newArrivals,
  onEnterTrade,
  refreshCartCount,
  listProps,
}: Props) {
  return (
    <>
      <div
        role="group"
        aria-label="Enter shop"
        className="mt-4 grid grid-cols-4 gap-2"
      >
        {PRO_TRADE_OPTIONS.filter(
          (t) => !allowedTradeKeys || allowedTradeKeys.includes(t.id),
        ).map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onEnterTrade(opt.id)}
              className="flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1 rounded-full border-0 bg-ona-field px-2 py-2.5 text-ona-ink transition-colors active:bg-ona-field-strong"
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              <span className="max-w-full truncate text-[12px] font-medium leading-none">
                {opt.homeLabel}
              </span>
            </button>
          );
        })}
      </div>

      {popular.length > 0 ? (
        <>
          <p className={`${onaEyebrowClass} pb-2 pt-5`}>Popular</p>
          <ShopHomeProductList
            items={popular}
            onAdded={() => void refreshCartCount()}
            {...listProps}
          />
        </>
      ) : null}

      {newArrivals.length > 0 ? (
        <>
          <p className={`${onaEyebrowClass} pb-2 pt-5`}>New arrivals</p>
          <ShopHomeProductList
            items={newArrivals}
            horizontal
            onAdded={() => void refreshCartCount()}
            {...listProps}
          />
        </>
      ) : null}
    </>
  );
}
