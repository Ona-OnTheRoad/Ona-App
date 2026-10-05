import { cn } from "@/lib/utils";
import { ShopHomeProductList } from "./shop-home-product-list";
import type { ShopHomeProduct, ShopHomeTone } from "./shop-home-types";

type Props = {
  tone: ShopHomeTone;
  q: string;
  results: ShopHomeProduct[];
  intentLabel: string | null;
  suggestedTrade: string | null;
  defaultTradeKey: string | null;
  onClear: () => void;
  onTryAnother: () => void;
  onJumpToTrade: () => void;
  listProps: Omit<
    React.ComponentProps<typeof ShopHomeProductList>,
    "items" | "tint" | "onAdded"
  >;
};

function postProductRequest(
  searchTerm: string,
  tradeKey: string,
  notify: boolean,
) {
  void fetch("/api/shop/product-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ searchTerm, tradeKey, notify }),
  });
}

export function ShopHomeResults({
  tone,
  q,
  results,
  intentLabel,
  suggestedTrade,
  defaultTradeKey,
  onClear,
  onTryAnother,
  onJumpToTrade,
  listProps,
}: Props) {
  const { isLight, accentText, accentBg, muted } = tone;
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
      {suggestedTrade ? (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onJumpToTrade}
            className={cn(
              "w-full rounded-xl border-0 px-3 py-2.5 text-left text-[12px] font-bold",
              isLight
                ? "bg-[#E85A28]/15 text-slate-900"
                : "bg-[#FF6B35]/20 text-white",
            )}
          >
            Jump to <span className={accentText}>{suggestedTrade}</span> shop
            search →
          </button>
        </div>
      ) : null}
      {results.length === 0 ? (
        <div className="px-4 py-4">
          <p className={cn("text-[13px] font-semibold", muted)}>
            No matching product found.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "rounded-lg border-0 px-3 py-2 text-[12px] font-bold text-white",
                accentBg,
              )}
              onClick={() =>
                postProductRequest(
                  q.trim(),
                  defaultTradeKey || suggestedTrade || "mechanic",
                  false,
                )
              }
            >
              Request Product
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg border-0 px-3 py-2 text-[12px] font-bold",
                isLight
                  ? "bg-black/10 text-slate-900"
                  : "bg-white/10 text-white",
              )}
              onClick={() =>
                postProductRequest(
                  q.trim(),
                  defaultTradeKey || suggestedTrade || "mechanic",
                  true,
                )
              }
            >
              Notify Me
            </button>
            <button
              type="button"
              className={`border-0 bg-transparent text-[12px] font-semibold ${accentText}`}
              onClick={onTryAnother}
            >
              Try Another Search
            </button>
          </div>
        </div>
      ) : (
        <ShopHomeProductList items={results} {...listProps} />
      )}
    </>
  );
}
