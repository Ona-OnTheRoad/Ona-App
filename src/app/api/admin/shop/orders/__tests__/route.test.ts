import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeDb } from "@/lib/server/shop/__tests__/fake-supabase";

let db: FakeDb;
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => db.client }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
const auth = vi.hoisted(() => {
  class AdminAuthError extends Error {
    constructor(message: string, public status: number, public code: string) {
      super(message);
    }
  }
  return { requireAdmin: vi.fn(), AdminAuthError };
});
vi.mock("@/lib/server/admin-auth", () => auth);

import { GET } from "@/app/api/admin/shop/orders/route";

const get = (qs = "") => GET(new Request(`http://localhost/api/admin/shop/orders${qs}`));

beforeEach(() => {
  vi.clearAllMocks();
  auth.requireAdmin.mockResolvedValue({ session: { userId: "a" } });
  db = makeFakeDb({
    shop_orders: [
      { id: "o1", order_number: "OS-1", status: "paid", total_minor: 100, currency: "NGN", created_at: "2026-11-28T10:00:00Z", user_id: "u1" },
    ],
    profiles: [{ id: "u1", full_name: "Ada", phone: "1" }],
    shop_deliveries: [{ order_id: "o1", status: "pending" }],
  });
});

describe("GET /api/admin/shop/orders", () => {
  it("keeps the original contract (orders[].delivery, setupRequired) and adds buyer + needsAttention", async () => {
    const res = await get();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.setupRequired).toBe(false);
    expect(json.data.needsAttention).toBe(0);
    expect(json.data.orders[0]).toMatchObject({
      id: "o1",
      order_number: "OS-1",
      delivery: { status: "pending" },
      buyer: { full_name: "Ada" },
    });
  });
  it("requires an admin", async () => {
    auth.requireAdmin.mockRejectedValue(new auth.AdminAuthError("Unauthorized", 401, "unauthorized"));
    expect((await get()).status).toBe(401);
  });
  it("reports setupRequired when the shop tables are not migrated", async () => {
    db.client.from = (() => {
      throw { message: 'relation "shop_orders" does not exist' };
    }) as never;
    const res = await get();
    expect((await res.json()).data.setupRequired).toBe(true);
  });
});
