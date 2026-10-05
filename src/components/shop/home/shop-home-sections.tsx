import { PRO_TRADE_OPTIONS } from "@/lib/services";
import { cn } from "@/lib/utils";
import { ShopHomeProductList } from "./shop-home-product-list";
import type { ShopHomeProduct, ShopHomeTone } from "./shop-home-types";

type Props = {
  tone: ShopHomeTone;
  allowedTradeKeys: string[] | null;
  popular: ShopHomeProduct[];
  newArrivals: ShopHomeProduct[];
  onEnterTrade: (tradeId: string) => void;
  refreshCartCount: () => Promise<void>;
  listProps: Omit<
    React.ComponentProps<typeof ShopHomeProductList>,
    "items" | "tint" | "onAdded"
  >;
};

export function ShopHomeSections({
  tone,
  allowedTradeKeys,
  popular,
  newArrivals,
  onEnterTrade,
  refreshCartCount,
  listProps,
}: Props) {
  const { isLight, accentText } = tone;
  return (
    <>
      <p className="px-3 pt-4 pb-2 text-[13px] font-black tracking-tight">
        Enter shop
      </p>
      <div className="grid grid-cols-4 gap-2 px-3">
        {PRO_TRADE_OPTIONS.filter(
          (t) => !allowedTradeKeys || allowedTradeKeys.includes(t.id),
        ).map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onEnterTrade(opt.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-0 px-1 py-2.5",
                isLight
                  ? "bg-black/[0.02] text-slate-900"
                  : "bg-white/[0.02] text-white",
              )}
            >
              <Icon className={`h-5 w-5 ${accentText}`} strokeWidth={2.2} />
              <span className="truncate text-[10px] font-bold">
                {opt.homeLabel}
              </span>
            </button>
          );
        })}
      </div>

      {popular.length > 0 ? (
        <>
          <p className="px-3 pt-5 pb-2 text-[13px] font-black">Popular</p>
          <ShopHomeProductList
            items={popular}
            tint
            onAdded={() => void refreshCartCount()}
            {...listProps}
          />
        </>
      ) : null}

      {newArrivals.length > 0 ? (
        <>
          <p className="px-3 pt-5 pb-2 text-[13px] font-black">New arrivals</p>
          <ShopHomeProductList
            items={newArrivals}
            tint
            onAdded={() => void refreshCartCount()}
            {...listProps}
          />
        </>
      ) : null}
    </>
  );
}
