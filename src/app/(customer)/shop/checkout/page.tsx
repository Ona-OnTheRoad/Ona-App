"use client";

import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DeliveryAddressCard } from "@/components/shop/checkout/delivery-address-card";
import { OrderSummaryCard } from "@/components/shop/checkout/order-summary-card";
import { useCheckout } from "@/components/shop/checkout/use-checkout";
import { formatShopPrice } from "@/components/shop/shared/format-shop-price";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ShopCheckoutPage() {
  const { theme, isAuthenticated } = useApp();
  const isLight = theme === "light";
  const c = useCheckout();
  const { cart, addressId, total } = c;

  const bg = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const card = isLight
    ? "bg-white/90 text-slate-900"
    : "bg-[#1c1c1e] text-white";
  const muted = isLight ? "text-slate-600" : "text-white/55";
  const border = isLight ? "border-black/10" : "border-white/10";

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", bg)}>
      <PageHeader title="Checkout" backHref="/shop/cart" />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 pt-2">
        {!isAuthenticated ? (
          <p className={cn("py-10 text-center text-[13px]", muted)}>
            Sign in to checkout.
          </p>
        ) : c.loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <p className={cn("py-10 text-center text-[13px]", muted)}>
            Cart is empty.
          </p>
        ) : (
          <>
            {/* Delivery address */}
            <DeliveryAddressCard
              isLight={isLight}
              card={card}
              muted={muted}
              border={border}
              showNewAddress={c.showNewAddress}
              setShowNewAddress={c.setShowNewAddress}
              newAddressText={c.newAddressText}
              setNewAddressText={c.setNewAddressText}
              createAddress={c.createAddress}
              addresses={c.addresses}
              addressId={addressId}
              setAddressId={c.setAddressId}
              selectedAddress={c.selectedAddress}
              zones={c.zones}
              zoneCode={c.zoneCode}
              setZoneCode={c.setZoneCode}
              estimating={c.estimating}
              estimate={c.estimate}
            />

            {/* Order summary */}
            <OrderSummaryCard
              card={card}
              muted={muted}
              border={border}
              cart={cart}
              subtotalMinor={c.subtotalMinor}
              estimating={c.estimating}
              estimate={c.estimate}
              deliveryFeeMinor={c.deliveryFeeMinor}
              total={total}
            />
            <p className={cn("mt-3 text-[11px] leading-relaxed", muted)}>
              Pay now to Ona Shop (retail). This is not job escrow no Repair Pro
              hold/release. Stock is reserved after successful payment.
            </p>
          </>
        )}
      </div>
      {cart && cart.items.length > 0 ? (
        <div className="absolute inset-x-0 bottom-0 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={c.paying || !addressId}
            onClick={() => void c.pay()}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[#FF6B35] text-[14px] font-bold text-white disabled:opacity-40"
          >
            {c.paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {addressId
              ? `Pay ${formatShopPrice(total)}`
              : "Select a delivery address"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
