import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/admin-auth", () => ({
  requireAdmin: vi.fn(),
  AdminAuthError: class AdminAuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/lib/server/shop/admin-analytics", () => ({
  getShopDemandAnalytics: vi.fn(),
}));

import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { getShopDemandAnalytics } from "@/lib/server/shop/admin-analytics";
import { GET } from "@/app/api/admin/shop/analytics/route";

const requireAdminMock = vi.mocked(requireAdmin);
const getShopDemandAnalyticsMock = vi.mocked(getShopDemandAnalytics);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/shop/analytics", () => {
  it("returns the analytics payload for an authenticated admin", async () => {
    requireAdminMock.mockResolvedValue({} as never);
    getShopDemandAnalyticsMock.mockResolvedValue({
      topZeroResult: [{ query: "brake pad", count: 3 }],
      openProductRequests: [],
      listingCounts: { available: 1, low_stock: 0, out_of_stock: 0 },
      recentZeroEvents: [],
    });

    const res = await GET(new Request("http://localhost/api/admin/shop/analytics") as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.topZeroResult).toEqual([{ query: "brake pad", count: 3 }]);
  });

  it("returns 401 when the caller isn't an admin", async () => {
    requireAdminMock.mockRejectedValue(new AdminAuthError("Not authenticated", 401));

    const res = await GET(new Request("http://localhost/api/admin/shop/analytics") as never);
    expect(res.status).toBe(401);
  });

  it("reports setupRequired when the analytics tables aren't migrated", async () => {
    requireAdminMock.mockResolvedValue({} as never);
    getShopDemandAnalyticsMock.mockRejectedValue(
      new Error('relation "shop_seller_listings" does not exist'),
    );

    const res = await GET(new Request("http://localhost/api/admin/shop/analytics") as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.setupRequired).toBe(true);
  });
});
