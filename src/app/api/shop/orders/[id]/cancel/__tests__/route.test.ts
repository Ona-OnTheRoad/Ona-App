import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(async () => ({ ok: true, userId: "user-1", token: "t", user: {} })),
}));
const orders = vi.hoisted(() => ({ cancelUnpaidOrder: vi.fn() }));
vi.mock("@/lib/server/shop/orders", () => orders);

import { POST } from "@/app/api/shop/orders/[id]/cancel/route";

const call = () =>
  POST(new Request("http://localhost/x", { method: "POST" }) as never, {
    params: Promise.resolve({ id: "o1" }),
  });

beforeEach(() => vi.clearAllMocks());

describe("POST /api/shop/orders/[id]/cancel (H3)", () => {
  it("cancels the caller's own unpaid order", async () => {
    orders.cancelUnpaidOrder.mockResolvedValue(undefined);
    const res = await call();
    expect(res.status).toBe(200);
    expect(orders.cancelUnpaidOrder).toHaveBeenCalledWith({ orderId: "o1", userId: "user-1" });
  });
  it("404 for an order that is not theirs / does not exist", async () => {
    orders.cancelUnpaidOrder.mockRejectedValue(new Error("Order not found"));
    expect((await call()).status).toBe(404);
  });
  it("409 when the order is already paid", async () => {
    orders.cancelUnpaidOrder.mockRejectedValue(new Error("Only unpaid orders can be cancelled"));
    expect((await call()).status).toBe(409);
  });
  it("409 when payment landed in the meantime", async () => {
    orders.cancelUnpaidOrder.mockRejectedValue(new Error("Order can no longer be cancelled (it may have just been paid)"));
    expect((await call()).status).toBe(409);
  });
  it("500 with a generic message on anything unexpected", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    orders.cancelUnpaidOrder.mockRejectedValue(new Error("pg internal xyz"));
    const res = await call();
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("pg internal xyz");
    spy.mockRestore();
  });
});
