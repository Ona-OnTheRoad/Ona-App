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

vi.mock("@/lib/server/security/admin-actions", () => ({
  logAdminAction: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/server/shop/admin-couriers", () => ({
  listCourierProviders: vi.fn(),
  upsertCourierProvider: vi.fn(),
  patchCourierProvider: vi.fn(),
}));

import { AdminAuthError, requireAdmin } from "@/lib/server/admin-auth";
import { logAdminAction } from "@/lib/server/security/admin-actions";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  listCourierProviders,
  patchCourierProvider,
  upsertCourierProvider,
} from "@/lib/server/shop/admin-couriers";
import { GET, PATCH, POST } from "@/app/api/admin/shop/couriers/route";

const requireAdminMock = vi.mocked(requireAdmin);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const listCourierProvidersMock = vi.mocked(listCourierProviders);
const upsertCourierProviderMock = vi.mocked(upsertCourierProvider);
const patchCourierProviderMock = vi.mocked(patchCourierProvider);

const ADMIN = {
  session: { userId: "admin-1" },
  profile: { full_name: "Ada Admin" },
};

function req(body: unknown) {
  return new Request("http://localhost/api/admin/shop/couriers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("GET /api/admin/shop/couriers", () => {
  it("returns the provider list", async () => {
    requireAdminMock.mockResolvedValue(ADMIN as never);
    listCourierProvidersMock.mockResolvedValue([{ id: "p1" }]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.providers).toEqual([{ id: "p1" }]);
  });

  it("returns 401 when not an admin", async () => {
    requireAdminMock.mockRejectedValue(new AdminAuthError("Not authenticated", 401));

    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/shop/couriers", () => {
  it("creates a provider and logs the admin action", async () => {
    requireAdminMock.mockResolvedValue(ADMIN as never);
    upsertCourierProviderMock.mockResolvedValue({ provider: { id: "new-1" } });

    const res = await POST(req({ name: "Speedy" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.provider).toEqual({ id: "new-1" });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: "create-courier", targetId: "new-1" }),
    );
  });

  it("logs an update when id is provided", async () => {
    requireAdminMock.mockResolvedValue(ADMIN as never);
    upsertCourierProviderMock.mockResolvedValue({ provider: { id: "p1" } });

    await POST(req({ id: "p1", name: "Speedy" }));

    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: "update-courier", targetId: "p1" }),
    );
  });

  it("returns 400 for a duplicate provider name", async () => {
    requireAdminMock.mockResolvedValue(ADMIN as never);
    upsertCourierProviderMock.mockResolvedValue({ provider: null, duplicateName: true });

    const res = await POST(req({ name: "Speedy" }));
    expect(res.status).toBe(400);
    expect(logAdminAction).not.toHaveBeenCalled();
  });

  it("returns 400 when name is missing", async () => {
    requireAdminMock.mockResolvedValue(ADMIN as never);

    const res = await POST(req({}));
    expect(res.status).toBe(400);
    expect(upsertCourierProviderMock).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/shop/couriers", () => {
  it("patches a provider and logs the action", async () => {
    requireAdminMock.mockResolvedValue(ADMIN as never);
    patchCourierProviderMock.mockResolvedValue({ id: "p1", active: false });

    const res = await PATCH(req({ id: "p1", active: false }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.provider).toEqual({ id: "p1", active: false });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: "update-courier", targetId: "p1" }),
    );
  });

  it("returns 400 when id is missing", async () => {
    requireAdminMock.mockResolvedValue(ADMIN as never);

    const res = await PATCH(req({}));
    expect(res.status).toBe(400);
  });
});
