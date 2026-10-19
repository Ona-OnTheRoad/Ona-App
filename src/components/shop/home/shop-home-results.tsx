import { Button } from "@/components/ui/button";
import { ShopHomeProductList } from "./shop-home-product-list";
import type { ShopHomeProduct } from "./shop-home-types";

type Props = {
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
    "items" | "horizontal" | "onAdded"
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
  return (
    <>
      <div className="flex items-center justify-between py-3">
        <p className="text-[13px] font-semibold text-ona-ink">
          {intentLabel || "Results"}
        </p>
        <button
          type="button"
          className="border-0 bg-transparent text-[12px] font-semibold text-ona-brand-ink"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      {suggestedTrade ? (
        <button
          type="button"
          onClick={onJumpToTrade}
          className="mb-2 w-full rounded-ona-ctl border border-ona-brand/40 bg-ona-brand-soft px-3 py-2.5 text-left text-[12px] font-semibold text-ona-ink"
        >
          Jump to <span className="text-ona-brand-ink">{suggestedTrade}</span>{" "}
          shop search →
        </button>
      ) : null}
      {results.length === 0 ? (
        <div className="py-4">
          <p className="text-[13px] font-semibold text-ona-muted">
            No matching product found.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="ona"
              size="ona"
              className="w-auto"
              onClick={() =>
                postProductRequest(
                  q.trim(),
                  defaultTradeKey || suggestedTrade || "mechanic",
                  false,
                )
              }
            >
              Request Product
            </Button>
            <Button
              variant="onaOutline"
              size="ona"
              className="w-auto"
              onClick={() =>
                postProductRequest(
                  q.trim(),
                  defaultTradeKey || suggestedTrade || "mechanic",
                  true,
                )
              }
            >
              Notify Me
            </Button>
            <button
              type="button"
              className="border-0 bg-transparent text-[12px] font-semibold text-ona-brand-ink"
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
