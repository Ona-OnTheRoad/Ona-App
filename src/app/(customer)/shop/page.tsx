"use client";

/**
 * ONA Shop home repair commerce catalog browser.
 * Customer: trade bar "Shop". Repair Pro: hamburger Shop.
 */

import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { OnaScreen } from "@/components/ui/ona-screen";
import { ShopVehicleBar } from "@/components/shop/shop-vehicle-bar";
import { ShopHomeHeaderActions } from "@/components/shop/home/shop-home-header-actions";
import { ShopHomeResults } from "@/components/shop/home/shop-home-results";
import { ShopHomeSearchBox } from "@/components/shop/home/shop-home-search-box";
import { ShopHomeSections } from "@/components/shop/home/shop-home-sections";
import { useShopHomeCart } from "@/components/shop/home/use-shop-home-cart";
import { useShopHomeData } from "@/components/shop/home/use-shop-home-data";
import { useShopHomeSearch } from "@/components/shop/home/use-shop-home-search";
import { useApp } from "@/lib/store";

export default function ShopHomePage() {
  const { isAuthenticated, accountType } = useApp();
  const router = useRouter();
  const ctx = accountType === "professional" ? "professional" : "motorist";
  const data = useShopHomeData(ctx);
  const search = useShopHomeSearch(ctx);
  const cart = useShopHomeCart(isAuthenticated, accountType);
  const { q, setQ, results, setResults } = search;
  const { setIntentLabel, setSuggestedTrade } = search;

  const listProps = {
    cartQtyById: cart.cartQtyById,
    optimisticAdd: cart.optimisticAdd,
    optimisticRevert: cart.optimisticRevert,
    refreshCartCount: cart.refreshCartCount,
  };

  return (
    <OnaScreen>
      <div className="pb-4 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ona-ink">
            {data.shopTitle}
          </h1>
          <ShopHomeHeaderActions
            cartCount={cart.cartCount}
            onOrders={() => router.push("/shop/orders")}
            onCart={() => router.push("/shop/cart")}
          />
        </div>
        {data.allowBrowseAllParts ? (
          <div className="mb-3">
            <ShopVehicleBar tradeKey={data.defaultTradeKey || "mechanic"} />
          </div>
        ) : null}
        <ShopHomeSearchBox
          q={q}
          setQ={setQ}
          searching={search.searching}
          isAuthenticated={isAuthenticated}
          onSubmit={() => void search.runSearch()}
        />

        {data.loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              aria-label="Loading"
              className="h-8 w-8 animate-spin text-ona-brand-ink"
            />
          </div>
        ) : data.setupRequired && data.popular.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingBag
              aria-hidden
              className="mx-auto h-10 w-10 text-ona-muted"
            />
            <p className="mt-3 text-[15px] font-semibold text-ona-ink">
              Shop is almost ready
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ona-muted">
              Apply migration{" "}
              <code className="text-[11px]">
                20260809_050_ona_shop_core.sql
              </code>{" "}
              and run the sample seed to load catalog products.
            </p>
          </div>
        ) : results ? (
          <ShopHomeResults
            q={q}
            results={results}
            intentLabel={search.intentLabel}
            suggestedTrade={search.suggestedTrade}
            defaultTradeKey={data.defaultTradeKey}
            onClear={() => {
              setResults(null);
              setIntentLabel(null);
              setSuggestedTrade(null);
              setQ("");
            }}
            onTryAnother={() => {
              setResults(null);
              setQ("");
            }}
            onJumpToTrade={() => {
              const path = `/shop/c/${search.suggestedTrade}`;
              const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
              router.push(`${path}${qs}`);
            }}
            listProps={listProps}
          />
        ) : (
          <ShopHomeSections
            allowedTradeKeys={data.allowedTradeKeys}
            popular={data.popular}
            newArrivals={data.newArrivals}
            onEnterTrade={(id) => router.push(`/shop/c/${id}`)}
            refreshCartCount={cart.refreshCartCount}
            listProps={listProps}
          />
        )}
      </div>
    </OnaScreen>
  );
}
