import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server/admin-auth", () => ({
  requirePermission: vi.fn(),
  AdminAuthError: class AdminAuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/server/shop/admin-catalog", () => ({
  adminCreateProduct: vi.fn(),
  adminListProducts: vi.fn(),
  adminListCategories: vi.fn(),
}));

import { AdminAuthError, requirePermission } from "@/lib/server/admin-auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  adminCreateProduct,
  adminListCategories,
  adminListProducts,
} from "@/lib/server/shop/admin-catalog";
import { GET, POST } from "@/app/api/admin/shop/products/route";

const requirePermissionMock = vi.mocked(requirePermission);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const adminCreateProductMock = vi.mocked(adminCreateProduct);
const adminListProductsMock = vi.mocked(adminListProducts);
const adminListCategoriesMock = vi.mocked(adminListCategories);

const ADMIN = {
  session: { userId: "admin-1" },
  profile: { full_name: "Ada Admin" },
};

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/admin/shop/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getReq(qs = "") {
  return new NextRequest(`http://localhost/api/admin/shop/products${qs}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("GET /api/admin/shop/products", () => {
  it("lists products and categories for shop_catalog", async () => {
    requirePermissionMock.mockResolvedValue(ADMIN as never);
    adminListProductsMock.mockResolvedValue([{ id: "p1" }] as never);
    adminListCategoriesMock.mockResolvedValue([{ id: "c1" }] as never);

    const res = await GET(getReq("?limit=10"));
    const json = await res.json();

    expect(requirePermissionMock).toHaveBeenCalledWith("shop_catalog");
    expect(res.status).toBe(200);
    expect(json.data.products).toEqual([{ id: "p1" }]);
    expect(json.data.categories).toEqual([{ id: "c1" }]);
  });

  it("returns 401 when permission fails", async () => {
    requirePermissionMock.mockRejectedValue(
      new AdminAuthError("Not authenticated", 401),
    );

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/shop/products", () => {
  const validBody = {
    name: "Brake pad set",
    tradeKey: "mechanic",
    categoryId: "cat-1",
    sku: "BP-001",
    priceMajor: 18500,
    stockQty: 12,
    status: "active",
  };

  it("creates a product via adminCreateProduct", async () => {
    requirePermissionMock.mockResolvedValue(ADMIN as never);
    adminCreateProductMock.mockResolvedValue({
      product: { id: "prod-1", name: "Brake pad set" },
      variant: { id: "var-1" },
    } as never);

    const res = await POST(postReq(validBody));
    const json = await res.json();

    expect(requirePermissionMock).toHaveBeenCalledWith("shop_catalog");
    expect(adminCreateProductMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Brake pad set",
        tradeKey: "mechanic",
        categoryId: "cat-1",
        sku: "BP-001",
        priceMajor: 18500,
        stockQty: 12,
      }),
      "admin-1",
    );
    expect(res.status).toBe(201);
    expect(json.data.product.id).toBe("prod-1");
  });

  it("rejects missing required fields with 400", async () => {
    requirePermissionMock.mockResolvedValue(ADMIN as never);

    const res = await POST(
      postReq({ name: "X", tradeKey: "mechanic", sku: "S1" }),
    );
    expect(res.status).toBe(400);
    expect(adminCreateProductMock).not.toHaveBeenCalled();
  });

  it("rejects negative priceMajor", async () => {
    requirePermissionMock.mockResolvedValue(ADMIN as never);

    const res = await POST(postReq({ ...validBody, priceMajor: -1 }));
    expect(res.status).toBe(400);
    expect(adminCreateProductMock).not.toHaveBeenCalled();
  });

  it("returns 401 without shop_catalog", async () => {
    requirePermissionMock.mockRejectedValue(
      new AdminAuthError("Forbidden", 403),
    );

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(403);
    expect(adminCreateProductMock).not.toHaveBeenCalled();
  });

  it("returns 503 when Supabase admin is not configured", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(503);
    expect(requirePermissionMock).not.toHaveBeenCalled();
  });
});
