import "server-only";
/**
 * Mechanic Shop demand analytics for Admin: zero-result search terms,
 * open product requests, and listing-status counts.
 */

import { createServiceSupabase } from "@/lib/supabase/server";

export type ShopDemandAnalytics = {
  topZeroResult: { query: string; count: number }[];
  openProductRequests: unknown[];
  listingCounts: {
    available: number;
    low_stock: number;
    out_of_stock: number;
  };
  recentZeroEvents: unknown[];
};

export async function getShopDemandAnalytics(): Promise<ShopDemandAnalytics> {
  const sb = createServiceSupabase();

  const { data: zeroEvents } = await sb
    .from("shop_search_events")
    .select("query, trade_key, created_at, vehicle_make, vehicle_model")
    .eq("zero_result", true)
    .order("created_at", { ascending: false })
    .limit(200);

  const zeroCounts = new Map<string, number>();
  for (const e of zeroEvents ?? []) {
    const q = String(e.query || "")
      .toLowerCase()
      .trim();
    if (!q) continue;
    zeroCounts.set(q, (zeroCounts.get(q) || 0) + 1);
  }
  const topZeroResult = [...zeroCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([query, count]) => ({ query, count }));

  const { data: requests } = await sb
    .from("shop_product_requests")
    .select("search_term, status, trade_key")
    .eq("status", "open")
    .limit(100);

  const { count: listingAvailable } = await sb
    .from("shop_seller_listings")
    .select("id", { count: "exact", head: true })
    .eq("listing_status", "available")
    .eq("is_active", true);

  const { count: listingLow } = await sb
    .from("shop_seller_listings")
    .select("id", { count: "exact", head: true })
    .eq("listing_status", "low_stock")
    .eq("is_active", true);

  const { count: listingOos } = await sb
    .from("shop_seller_listings")
    .select("id", { count: "exact", head: true })
    .eq("listing_status", "out_of_stock")
    .eq("is_active", true);

  return {
    topZeroResult,
    openProductRequests: requests ?? [],
    listingCounts: {
      available: listingAvailable ?? 0,
      low_stock: listingLow ?? 0,
      out_of_stock: listingOos ?? 0,
    },
    recentZeroEvents: (zeroEvents ?? []).slice(0, 40),
  };
}
