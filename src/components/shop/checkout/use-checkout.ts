"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CartView } from "@/lib/types/shop-cart";
import {
  shopCheckout,
  shopCreateAddress,
  shopEstimateDelivery,
  shopGetCart,
  shopListAddresses,
  type DeliveryEstimateView,
  type SavedAddress,
} from "@/lib/shop/client";
import { useApp } from "@/lib/store";

export function useCheckout() {
  const { accountType, isAuthenticated, backendUserId } = useApp();
  const router = useRouter();
  const ctx = accountType === "professional" ? "professional" : "motorist";
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [zoneCode, setZoneCode] = useState<string>("default");
  const [zones, setZones] = useState<Array<{ code: string; name: string }>>([]);
  const [estimate, setEstimate] = useState<
    DeliveryEstimateView["estimate"] | null
  >(null);
  const [estimating, setEstimating] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddressText, setNewAddressText] = useState("");

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await shopGetCart(ctx);
      setCart(data.cart);
      if (backendUserId) {
        const addr = await shopListAddresses(backendUserId);
        setAddresses(addr);
        if (addr.length > 0) {
          setAddressId(addr.find((a) => a.is_default)?.id ?? addr[0].id);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [ctx, isAuthenticated, backendUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const subtotalMinor = cart?.subtotalMinor ?? 0;
  const itemsCount = cart?.items.length ?? 0;

  const fetchEstimate = useCallback(
    async (aid: string | null, zone: string, subtotal: number) => {
      if (!aid) {
        setEstimate(null);
        return;
      }
      setEstimating(true);
      try {
        const view = await shopEstimateDelivery({
          addressId: aid,
          subtotalMinor: subtotal,
          zoneCode: zone,
        });
        setZones(view.zones);
        setEstimate(view.estimate);
      } catch {
        setEstimate(null);
      } finally {
        setEstimating(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!addressId || !cart) return;
    void fetchEstimate(addressId, zoneCode, subtotalMinor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId, zoneCode, cart, isAuthenticated]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === addressId) ?? null,
    [addresses, addressId],
  );

  const deliveryFeeMinor = estimate?.freeDelivery
    ? 0
    : (estimate?.deliveryFeeMinor ?? 0);
  const total = subtotalMinor + (itemsCount ? deliveryFeeMinor : 0);

  const createAddress = async () => {
    if (!backendUserId || !newAddressText.trim()) {
      setError("Enter an address to continue.");
      return;
    }
    setError(null);
    try {
      const created = await shopCreateAddress({
        userId: backendUserId,
        label: "Home",
        addressText: newAddressText.trim(),
        isDefault: addresses.length === 0,
      });
      const next = [created, ...addresses];
      setAddresses(next);
      setAddressId(created.id);
      setShowNewAddress(false);
      setNewAddressText("");
      setZoneCode("default");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save address");
    }
  };

  const pay = async () => {
    if (!addressId) {
      setError("Select or add a delivery address.");
      return;
    }
    if (!estimate) {
      setError("Computing delivery… try again.");
      return;
    }
    setPaying(true);
    setError(null);
    try {
      const data = await shopCheckout({
        accountContext: ctx,
        addressId,
        zoneCode,
        notes: undefined,
      });
      if (data.payment.authorizationUrl) {
        window.location.href = data.payment.authorizationUrl;
        return;
      }
      // Mock provider may return empty URL verify immediately with ref
      if (data.payment.provider === "mock" && data.payment.reference) {
        router.push(
          `/shop/checkout/callback?ref=${encodeURIComponent(
            data.payment.reference,
          )}&order=${encodeURIComponent(data.orderId)}`,
        );
        return;
      }
      setError("No payment URL returned. Check Flutterwave keys.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPaying(false);
    }
  };

  return {
    cart,
    loading,
    paying,
    error,
    addresses,
    addressId,
    setAddressId,
    zoneCode,
    setZoneCode,
    zones,
    estimate,
    estimating,
    showNewAddress,
    setShowNewAddress,
    newAddressText,
    setNewAddressText,
    subtotalMinor,
    selectedAddress,
    deliveryFeeMinor,
    total,
    createAddress,
    pay,
  };
}
