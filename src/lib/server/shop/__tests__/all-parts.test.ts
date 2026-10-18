import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

vi.mock("@/lib/server/shop/catalog", () => ({
  listProducts: vi.fn(),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import { listProducts } from "@/lib/server/shop/catalog";
import {
  buildCategoryProductCounts,
  compareEnrichedByFitmentThenPrice,
  enrichProductWithFitment,
  getAllPartsForVehicle,
  rollupCategoryTree,
  type EnrichedPartProduct,
} from "@/lib/server/shop/all-parts";
import type { ShopProductCard } from "@/lib/server/shop/types";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);
const listProductsMock = vi.mocked(listProducts);

function product(overrides: Partial<ShopProductCard> = {}): ShopProductCard {
  return {
    id: "p1",
    name: "Brake Pad",
    subtitle: "",
    fromPriceMinor: 1000,
    inStock: true,
    ...overrides,
  } as ShopProductCard;
}

describe("enrichProductWithFitment", () => {
  it("prefers the DB fitment map over a soft text match", () => {
    const fitMap = new Map([["p1", "direct_fit"]]);
    const result = enrichProductWithFitment(
      product(),
      fitMap,
      { makeName: "Toyota", modelName: "Camry" },
    );
    expect(result.fitmentStatus).toBe("direct_fit");
    expect(result.fitmentBadge).toBe("Fits your vehicle");
  });

  it("falls back to a soft match when make+model appear in the name", () => {
    const result = enrichProductWithFitment(
      product({ name: "Toyota Camry Brake Pad" }),
      new Map(),
      { makeName: "Toyota", modelName: "Camry" },
    );
    expect(result.fitmentStatus).toBe("compatible");
    expect(result.fitmentBadge).toBe("Compatible");
  });

  it("has no fitment badge when neither the DB map nor the soft match hit", () => {
    const result = enrichProductWithFitment(
      product({ name: "Generic Wiper Blade" }),
      new Map(),
      { makeName: "Toyota", modelName: "Camry" },
    );
    expect(result.fitmentStatus).toBeNull();
    expect(result.fitmentBadge).toBeNull();
  });
});

describe("compareEnrichedByFitmentThenPrice", () => {
  function enriched(overrides: Partial<EnrichedPartProduct>): EnrichedPartProduct {
    return {
      ...product(),
      fitmentStatus: null,
      fitmentBadge: null,
      ...overrides,
    } as EnrichedPartProduct;
  }

  it("ranks a fitment-matched product above one without a badge", () => {
    const matched = enriched({ fitmentBadge: "Compatible", fromPriceMinor: 5000 });
    const unmatched = enriched({ fitmentBadge: null, fromPriceMinor: 100 });
    expect(compareEnrichedByFitmentThenPrice(matched, unmatched)).toBeLessThan(0);
  });

  it("breaks ties between equally-matched products by lower price", () => {
    const cheap = enriched({ fitmentBadge: "Compatible", fromPriceMinor: 100 });
    const expensive = enriched({ fitmentBadge: "Compatible", fromPriceMinor: 5000 });
    expect(compareEnrichedByFitmentThenPrice(cheap, expensive)).toBeLessThan(0);
  });
});

describe("buildCategoryProductCounts", () => {
  it("counts rows per category_id and ignores rows without one", () => {
    const counts = buildCategoryProductCounts([
      { category_id: "cat-1" },
      { category_id: "cat-1" },
      { category_id: "cat-2" },
      { category_id: null },
    ]);
    expect(counts.get("cat-1")).toBe(2);
    expect(counts.get("cat-2")).toBe(1);
    expect(counts.size).toBe(2);
  });
});

describe("rollupCategoryTree", () => {
  const categories = [
    { id: "root", slug: "root", name: "Root", trade_key: "mechanic", depth: 0, path: "root", parent_id: null },
    { id: "child", slug: "child", name: "Child", trade_key: "mechanic", depth: 1, path: "root/child", parent_id: "root" },
    { id: "grandchild", slug: "gc", name: "Grandchild", trade_key: "mechanic", depth: 2, path: "root/child/gc", parent_id: "child" },
  ];

  it("rolls descendant counts up into ancestor categories by path prefix", () => {
    const counts = new Map([["grandchild", 3]]);
    const result = rollupCategoryTree(categories, counts);
    const child = result.find((c) => c.id === "child");
    expect(child?.productCount).toBe(3);
  });

  it("drops categories whose rolled-up count is zero", () => {
    const result = rollupCategoryTree(categories, new Map());
    expect(result).toEqual([]);
  });

  it("excludes depth-0 categories that have a parent (root-with-no-parent is kept)", () => {
    const counts = new Map([["root", 1]]);
    const result = rollupCategoryTree(categories, counts);
    expect(result.map((c) => c.id)).toEqual(["root"]);
  });
});

function makeSb(opts: {
  cats?: unknown[];
  fits?: unknown[];
  variants?: unknown[];
  categoryRows?: unknown[];
}) {
  const sb = {
    from: vi.fn((table: string) => {
      if (table === "shop_trade_categories") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(async () => ({ data: opts.cats ?? [] })),
              })),
            })),
          })),
        };
      }
      if (table === "shop_product_fitments") {
        const query = {
          in: vi.fn(() => query),
          neq: vi.fn(() => query),
          limit: vi.fn(() => query),
          eq: vi.fn(() => query),
          then: (resolve: (v: unknown) => void) =>
            Promise.resolve({ data: opts.fits ?? [] }).then(resolve),
        };
        return { select: vi.fn(() => query) };
      }
      if (table === "shop_product_variants") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: opts.variants ?? [] })),
            })),
          })),
        };
      }
      if (table === "shop_products") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(async () => ({ data: opts.categoryRows ?? [] })),
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

describe("getAllPartsForVehicle (integration)", () => {
  it("builds the tree: fitment-enriched, sorted products + non-empty categories", async () => {
    makeSb({
      cats: [
        { id: "cat-1", slug: "brakes", name: "Brakes", trade_key: "mechanic", depth: 1, path: "cat-1", parent_id: "root" },
      ],
      categoryRows: [{ id: "p1", category_id: "cat-1" }],
    });
    listProductsMock.mockResolvedValue([
      product({ id: "p1", name: "Toyota Camry Brake Pad", fromPriceMinor: 2000 }),
    ]);

    const result = await getAllPartsForVehicle({
      tradeKey: "mechanic",
      vehicle: { makeId: null, modelId: null, makeName: "Toyota", modelName: "Camry", year: null },
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].fitmentBadge).toBe("Compatible");
    expect(result.categories).toEqual([
      expect.objectContaining({ id: "cat-1", productCount: 1 }),
    ]);
  });

  it("omits categories with no products", async () => {
    makeSb({
      cats: [
        { id: "cat-1", slug: "brakes", name: "Brakes", trade_key: "mechanic", depth: 1, path: "cat-1", parent_id: "root" },
      ],
      categoryRows: [],
    });
    listProductsMock.mockResolvedValue([]);

    const result = await getAllPartsForVehicle({
      tradeKey: "mechanic",
      vehicle: { makeId: null, modelId: null, makeName: "Toyota", modelName: "Camry", year: null },
    });

    expect(result.categories).toEqual([]);
  });
});
