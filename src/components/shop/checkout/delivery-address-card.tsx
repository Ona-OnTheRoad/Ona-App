"use client";

import { MapPin, Plus } from "lucide-react";
import { formatShopPrice } from "@/components/shop/shared/format-shop-price";
import type { DeliveryEstimateView, SavedAddress } from "@/lib/shop/client";
import { cn } from "@/lib/utils";

export function DeliveryAddressCard({
  isLight,
  card,
  muted,
  border,
  showNewAddress,
  setShowNewAddress,
  newAddressText,
  setNewAddressText,
  createAddress,
  addresses,
  addressId,
  setAddressId,
  selectedAddress,
  zones,
  zoneCode,
  setZoneCode,
  estimating,
  estimate,
}: {
  isLight: boolean;
  card: string;
  muted: string;
  border: string;
  showNewAddress: boolean;
  setShowNewAddress: (v: boolean) => void;
  newAddressText: string;
  setNewAddressText: (v: string) => void;
  createAddress: () => Promise<void>;
  addresses: SavedAddress[];
  addressId: string | null;
  setAddressId: (v: string) => void;
  selectedAddress: SavedAddress | null;
  zones: Array<{ code: string; name: string }>;
  zoneCode: string;
  setZoneCode: (v: string) => void;
  estimating: boolean;
  estimate: DeliveryEstimateView["estimate"] | null;
}) {
  return (
    <div className={cn("rounded-xl p-3", card)}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-black">Delivery address</p>
        {!showNewAddress ? (
          <button
            type="button"
            onClick={() => setShowNewAddress(true)}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-[#FF6B35]"
          >
            <Plus className="h-3.5 w-3.5" /> Add new
          </button>
        ) : null}
      </div>

      {showNewAddress ? (
        <div className={cn("mt-2 space-y-2 border-t pt-2", border)}>
          <input
            value={newAddressText}
            onChange={(e) => setNewAddressText(e.target.value)}
            placeholder="Address text (e.g. 12 Admiralty Way, Lekki)"
            className={cn(
              "h-10 w-full rounded-lg border-0 px-3 text-[13px] outline-none",
              isLight ? "bg-black/5 text-slate-900" : "bg-white/10 text-white",
            )}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void createAddress()}
              className="h-10 flex-1 rounded-lg border-0 bg-[#FF6B35] text-[12px] font-bold text-white"
            >
              Save address
            </button>
            <button
              type="button"
              onClick={() => setShowNewAddress(false)}
              className={cn(
                "h-10 flex-1 rounded-lg border-0 text-[12px] font-bold",
                isLight
                  ? "bg-black/10 text-slate-900"
                  : "bg-white/10 text-white",
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-2 space-y-1.5">
        {addresses.length === 0 ? (
          <p className={cn("text-[12px]", muted)}>No saved addresses yet.</p>
        ) : (
          addresses.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAddressId(a.id)}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left",
                addressId === a.id
                  ? "border-[#FF6B35] bg-[#FF6B35]/10"
                  : border,
              )}
            >
              <MapPin
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  addressId === a.id ? "text-[#FF6B35]" : muted,
                )}
              />
              <span className="min-w-0">
                <span className="block text-[12px] font-bold">
                  {a.label}
                  {a.is_default ? (
                    <span
                      className={cn("ml-1 text-[10px] font-semibold", muted)}
                    >
                      · Default
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "block truncate text-[11px] font-medium",
                    muted,
                  )}
                >
                  {a.address_text}
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      {selectedAddress && zones.length > 0 ? (
        <div className={cn("mt-2 border-t pt-2", border)}>
          <p className="text-[12px] font-bold">Delivery zone</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {zones.map((z) => (
              <button
                key={z.code}
                type="button"
                onClick={() => setZoneCode(z.code)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                  zoneCode === z.code
                    ? "border-[#FF6B35] bg-[#FF6B35]/15 text-[#FF6B35]"
                    : border,
                )}
              >
                {z.name}
              </button>
            ))}
          </div>
          {estimating ? (
            <p className={cn("mt-1.5 text-[11px]", muted)}>
              Computing delivery…
            </p>
          ) : estimate ? (
            <p className={cn("mt-1.5 text-[11px]", muted)}>
              {estimate.freeDelivery
                ? "Free delivery on this order."
                : `Delivery fee ${formatShopPrice(estimate.deliveryFeeMinor)} · ${estimate.etaMinutesMin}-${estimate.etaMinutesMax} min via ${estimate.serviceName}.`}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
