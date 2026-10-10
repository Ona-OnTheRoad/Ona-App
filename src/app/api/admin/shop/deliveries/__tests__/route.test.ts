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

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/server/shop/admin-deliveries", () => ({
  upsertDeliveryStatus: vi.fn(),
}));

import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { upsertDeliveryStatus } from "@/lib/server/shop/admin-deliveries";
import { PATCH } from "@/app/api/admin/shop/deliveries/route";

const requireAdminMock = vi.mocked(requireAdmin);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const upsertDeliveryStatusMock = vi.mocked(upsertDeliveryStatus);

function req(body: unknown) {
  return new Request("http://localhost/api/admin/shop/deliveries", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("PATCH /api/admin/shop/deliveries", () => {
  it("passes the admin session's identity through as the actor", async () => {
    requireAdminMock.mockResolvedValue({
      session: { userId: "admin-1", email: "admin@ona.app" },
    } as never);
    upsertDeliveryStatusMock.mockResolvedValue({ id: "del-1" });

    const res = await PATCH(
      req({ orderId: "00000000-0000-4000-8000-000000000001", status: "assigned" }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.delivery).toEqual({ id: "del-1" });
    expect(upsertDeliveryStatusMock).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "admin-1", actorLabel: "admin@ona.app" }),
    );
  });

  it("returns 400 for an invalid body", async () => {
    requireAdminMock.mockResolvedValue({ session: {} } as never);

    const res = await PATCH(req({ orderId: "not-a-uuid" }));
    expect(res.status).toBe(400);
    expect(upsertDeliveryStatusMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the caller isn't an admin", async () => {
    requireAdminMock.mockRejectedValue(new AdminAuthError("Not authenticated", 401));

    const res = await PATCH(
      req({ orderId: "00000000-0000-4000-8000-000000000001" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 when Supabase admin isn't configured", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    const res = await PATCH(
      req({ orderId: "00000000-0000-4000-8000-000000000001" }),
    );
    expect(res.status).toBe(503);
    expect(requireAdminMock).not.toHaveBeenCalled();
  });
});
