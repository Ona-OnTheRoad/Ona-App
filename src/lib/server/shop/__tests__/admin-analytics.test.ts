import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import { getShopDemandAnalytics } from "@/lib/server/shop/admin-analytics";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function makeSb(opts: {
  zeroEvents?: { query: string }[];
  requests?: unknown[];
  counts?: { available?: number; low_stock?: number; out_of_stock?: number };
}) {
  const zeroEvents = opts.zeroEvents ?? [];
  const requests = opts.requests ?? [];
  const counts = opts.counts ?? {};
  const sb = {
    from: vi.fn((table: string) => {
      if (table === "shop_search_events") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(async () => ({ data: zeroEvents })),
              })),
            })),
          })),
        };
      }
      if (table === "shop_product_requests") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(async () => ({ data: requests })),
            })),
          })),
        };
      }
      if (table === "shop_seller_listings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, status: string) => ({
              eq: vi.fn(async () => {
                const map: Record<string, number | undefined> = {
                  available: counts.available,
                  low_stock: counts.low_stock,
                  out_of_stock: counts.out_of_stock,
                };
                return { count: map[status] ?? 0 };
              }),
            })),
          })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getShopDemandAnalytics", () => {
  it("groups zero-result events by normalized query and ranks by count", async () => {
    makeSb({
      zeroEvents: [
        { query: "Brake Pad" },
        { query: "brake pad" },
        { query: "oil filter" },
      ],
    });

    const result = await getShopDemandAnalytics();

    expect(result.topZeroResult[0]).toEqual({ query: "brake pad", count: 2 });
    expect(result.topZeroResult).toContainEqual({ query: "oil filter", count: 1 });
  });

  it("returns listing counts from the seller-listings table", async () => {
    makeSb({ counts: { available: 5, low_stock: 2, out_of_stock: 1 } });

    const result = await getShopDemandAnalytics();

    expect(result.listingCounts).toEqual({
      available: 5,
      low_stock: 2,
      out_of_stock: 1,
    });
  });

  it("defaults to zero/empty when no data exists", async () => {
    makeSb({});

    const result = await getShopDemandAnalytics();

    expect(result.topZeroResult).toEqual([]);
    expect(result.openProductRequests).toEqual([]);
    expect(result.listingCounts).toEqual({
      available: 0,
      low_stock: 0,
      out_of_stock: 0,
    });
  });
});
