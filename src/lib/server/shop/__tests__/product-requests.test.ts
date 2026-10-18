import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import {
  ProductRequestsNotMigratedError,
  recordProductRequest,
} from "@/lib/server/shop/product-requests";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function makeSb(result: { data: { id: string } | null; error?: { message: string } | null }) {
  const sb = {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => result),
        })),
      })),
    })),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordProductRequest", () => {
  it("inserts the request and returns its id", async () => {
    const sb = makeSb({ data: { id: "req-1" }, error: null });

    const result = await recordProductRequest({
      userId: "user-1",
      searchTerm: "  brake pad  ",
      tradeKey: "mechanic",
    });

    expect(result).toEqual({ id: "req-1" });
    const insertCall = (sb.from.mock.results[0].value as { insert: ReturnType<typeof vi.fn> }).insert;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({ search_term: "  brake pad  ", status: "open" }),
    );
  });

  it("throws ProductRequestsNotMigratedError when the table doesn't exist", async () => {
    makeSb({ data: null, error: { message: 'relation "shop_product_requests" does not exist' } });

    await expect(
      recordProductRequest({ searchTerm: "brake pad" }),
    ).rejects.toBeInstanceOf(ProductRequestsNotMigratedError);
  });

  it("throws a generic error for any other db failure", async () => {
    makeSb({ data: null, error: { message: "connection reset" } });

    await expect(
      recordProductRequest({ searchTerm: "brake pad" }),
    ).rejects.toThrow("connection reset");
  });
});
