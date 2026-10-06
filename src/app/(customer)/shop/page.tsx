"use client";

/**
 * ONA Shop home repair commerce catalog browser.
 * Customer: trade bar "Shop". Repair Pro: hamburger Shop.
 */

import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ShopVehicleBar } from "@/components/shop/shop-vehicle-bar";
import { ShopHomeHeaderActions } from "@/components/shop/home/shop-home-header-actions";
import { ShopHomeResults } from "@/components/shop/home/shop-home-results";
import { ShopHomeSearchBox } from "@/components/shop/home/shop-home-search-box";
import { ShopHomeSections } from "@/components/shop/home/shop-home-sections";
import type { ShopHomeTone } from "@/components/shop/home/shop-home-types";
import { useShopHomeCart } from "@/components/shop/home/use-shop-home-cart";
import { useShopHomeData } from "@/components/shop/home/use-shop-home-data";
import { useShopHomeSearch } from "@/components/shop/home/use-shop-home-search";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ShopHomePage() {
  const { theme, isAuthenticated, accountType } = useApp();
  const isLight = theme === "light";
  const router = useRouter();
  const ctx = accountType === "professional" ? "professional" : "motorist";
  const data = useShopHomeData(ctx);
  const search = useShopHomeSearch(ctx);
  const cart = useShopHomeCart(isAuthenticated, accountType);
  const { q, setQ, results, setResults } = search;
  const { setIntentLabel, setSuggestedTrade } = search;

  const bg = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const muted = isLight ? "text-slate-600" : "text-white/55";
  const accentText = isLight ? "text-[#E85A28]" : "text-[#FF6B35]";
  const accentBg = isLight ? "bg-[#E85A28]" : "bg-[#FF6B35]";
  const tone: ShopHomeTone = { isLight, accentText, accentBg, muted };
  const listProps = {
    muted,
    cartQtyById: cart.cartQtyById,
    optimisticAdd: cart.optimisticAdd,
    optimisticRevert: cart.optimisticRevert,
    refreshCartCount: cart.refreshCartCount,
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", bg)}>
      <PageHeader title={data.shopTitle} backHref={undefined} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <ShopHomeHeaderActions
          isLight={isLight}
          accentText={accentText}
          cartCount={cart.cartCount}
          onOrders={() => router.push("/shop/orders")}
          onCart={() => router.push("/shop/cart")}
        />
        {data.allowBrowseAllParts ? (
          <ShopVehicleBar tradeKey={data.defaultTradeKey || "mechanic"} />
        ) : null}
        <ShopHomeSearchBox
          tone={tone}
          q={q}
          setQ={setQ}
          searching={search.searching}
          isAuthenticated={isAuthenticated}
          onSubmit={() => void search.runSearch()}
        />

        {data.loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className={`h-8 w-8 animate-spin ${accentText}`} />
          </div>
        ) : data.setupRequired && data.popular.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <ShoppingBag className={`mx-auto h-10 w-10 ${accentText}`} />
            <p className="mt-3 text-[15px] font-bold">Shop is almost ready</p>
            <p className={cn("mt-1 text-[12px] leading-relaxed", muted)}>
              Apply migration{" "}
              <code className="text-[11px]">
                20260809_050_ona_shop_core.sql
              </code>{" "}
              and run the sample seed to load catalog products.
            </p>
          </div>
        ) : results ? (
          <ShopHomeResults
            tone={tone}
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
            tone={tone}
            allowedTradeKeys={data.allowedTradeKeys}
            popular={data.popular}
            newArrivals={data.newArrivals}
            onEnterTrade={(id) => router.push(`/shop/c/${id}`)}
            refreshCartCount={cart.refreshCartCount}
            listProps={listProps}
          />
        )}
      </div>
    </div>
  );
}
