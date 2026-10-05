"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ShopVehicleBar } from "@/components/shop/shop-vehicle-bar";
import { AUTOMEDICS_CATEGORIES } from "@/lib/shop/automedics-catalog";
import { PRO_TRADE_OPTIONS } from "@/lib/services";
import { listingMatchesCard } from "@/lib/shop/listing-status";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { TradeAllPartsView } from "@/components/shop/trade-page/trade-all-parts-view";
import { TradeBrowseView } from "@/components/shop/trade-page/trade-browse-view";
import { TradeResultsView } from "@/components/shop/trade-page/trade-results-view";
import { TradeSearchBox } from "@/components/shop/trade-page/trade-search-box";
import type { TradeTone } from "@/components/shop/trade-page/trade-page-types";
import { useTradeAllParts } from "@/components/shop/trade-page/use-trade-all-parts";
import { useTradeBrowse } from "@/components/shop/trade-page/use-trade-browse";
import { useTradeCart } from "@/components/shop/trade-page/use-trade-cart";
import { useTradeSearch } from "@/components/shop/trade-page/use-trade-search";

function ShopTradePageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawTrade = String(params.trade || "");
  const catFromPath = AUTOMEDICS_CATEGORIES.find((c) => c.slug === rawTrade);
  const trade = catFromPath ? "mechanic" : rawTrade;
  const { theme, accountType } = useApp();
  const isLight = theme === "light";
  const accentText = isLight ? "text-[#E85A28]" : "text-[#FF6B35]";
  const accentBg = isLight ? "bg-[#E85A28]" : "bg-[#FF6B35]";
  const { cartQtyById, optimisticAdd, optimisticRevert } = useTradeCart();
  const ctx = accountType === "professional" ? "professional" : "motorist";

  const allParts = searchParams.get("allParts") === "1";
  const catQuery = searchParams.get("cat") || catFromPath?.slug || "";
  const catMeta = AUTOMEDICS_CATEGORIES.find((c) => c.slug === catQuery);
  const label =
    catMeta?.name ||
    PRO_TRADE_OPTIONS.find((t) => t.id === trade)?.homeLabel ||
    trade;
  const searchExample = "product name or vehicle model";

  const parts = useTradeAllParts({ allParts, trade, ctx, searchParams });
  const search = useTradeSearch({ trade, ctx, label, allParts, searchParams });
  const { q, setQ, searched, setSearched, results, setResults } = search;
  const { availability, setAvailability, setIntentLabel } = search;
  const browse = useTradeBrowse({
    trade,
    ctx,
    allParts,
    catQuery,
    catMetaName: catMeta?.name,
    availability,
    searched,
  });

  const bg = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const tone: TradeTone = {
    isLight,
    accentText,
    accentBg,
    card: isLight ? "bg-black/[0.02]" : "bg-white/[0.02]",
    muted: isLight ? "text-slate-600" : "text-white/55",
  };
  const cartProps = { cartQtyById, optimisticAdd, optimisticRevert };

  // The stock chips (All/Available/Low/Out/Pre-order/Coming soon) only appear
  // alongside a product list, and tapping one narrows THAT list down.
  const visibleBrowse =
    availability === "all" || !browse.browseProducts
      ? browse.browseProducts
      : browse.browseProducts.filter((p) =>
          listingMatchesCard(p, availability),
        );
  const visibleResults =
    availability === "all" || !results
      ? results
      : results.filter((p) => listingMatchesCard(p, availability));

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", bg)}>
      <PageHeader
        title={allParts ? `ALL PARTS · ${label}` : label}
        backHref="/shop"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <ShopVehicleBar tradeKey={trade} />

        {allParts ? (
          <TradeAllPartsView tone={tone} {...parts} {...cartProps} />
        ) : (
          <>
            <TradeSearchBox
              tone={tone}
              q={q}
              label={label}
              searchExample={searchExample}
              searching={search.searching}
              onQueryChange={(value) => {
                setQ(value);
                if (!value.trim()) {
                  setSearched(false);
                  setResults([]);
                  setIntentLabel(null);
                }
              }}
              onSubmit={() => void search.runSearch()}
            />

            {!searched ? (
              <TradeBrowseView
                tone={tone}
                trade={trade}
                {...browse}
                visibleBrowse={visibleBrowse}
                availability={availability}
                setAvailability={setAvailability}
                {...cartProps}
              />
            ) : (
              <TradeResultsView
                tone={tone}
                label={label}
                searching={search.searching}
                visibleResults={visibleResults}
                intentLabel={search.intentLabel}
                availability={availability}
                setAvailability={setAvailability}
                onClear={() => {
                  setQ("");
                  setSearched(false);
                  setResults([]);
                  setIntentLabel(null);
                }}
                {...cartProps}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ShopTradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        </div>
      }
    >
      <ShopTradePageInner />
    </Suspense>
  );
}
