import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock("@/lib/server/shop/product-requests", () => ({
  ProductRequestsNotMigratedError: class ProductRequestsNotMigratedError extends Error {},
  recordProductRequest: vi.fn(),
}));

import { getUserFromRequest } from "@/lib/server/auth-utils";
import {
  ProductRequestsNotMigratedError,
  recordProductRequest,
} from "@/lib/server/shop/product-requests";
import { POST } from "@/app/api/shop/product-requests/route";

const getUserFromRequestMock = vi.mocked(getUserFromRequest);
const recordProductRequestMock = vi.mocked(recordProductRequest);

function req(body: unknown) {
  return new Request("http://localhost/api/shop/product-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/shop/product-requests", () => {
  it("records the request with the caller's own userId when signed in", async () => {
    getUserFromRequestMock.mockResolvedValue({ id: "user-1" } as never);
    recordProductRequestMock.mockResolvedValue({ id: "req-1" });

    const res = await POST(req({ searchTerm: "brake pad" }) as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe("req-1");
    expect(recordProductRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", searchTerm: "brake pad" }),
    );
  });

  it("records anonymously when there's no signed-in user", async () => {
    getUserFromRequestMock.mockResolvedValue(null);
    recordProductRequestMock.mockResolvedValue({ id: "req-2" });

    await POST(req({ searchTerm: "oil filter" }) as never);

    expect(recordProductRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null }),
    );
  });

  it("rejects a search term shorter than 2 characters", async () => {
    const res = await POST(req({ searchTerm: "a" }) as never);
    expect(res.status).toBe(400);
    expect(recordProductRequestMock).not.toHaveBeenCalled();
  });

  it("returns 503 when the table isn't migrated", async () => {
    getUserFromRequestMock.mockResolvedValue(null);
    recordProductRequestMock.mockRejectedValue(new ProductRequestsNotMigratedError());

    const res = await POST(req({ searchTerm: "brake pad" }) as never);
    expect(res.status).toBe(503);
  });
});
