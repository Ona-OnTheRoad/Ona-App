import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeDb } from "./fake-supabase";

let db: FakeDb;
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => db.client }));

const confirmJob = vi.hoisted(() => ({ confirmJobPayment: vi.fn() }));
vi.mock("@/lib/server/payments/confirm-job-payment", () => confirmJob);
vi.mock("@/lib/server/payments/escrow-store", () => ({ rowToEscrow: vi.fn() }));
vi.mock("@/lib/server/jobs/job-store/mappers", () => ({ rowToJob: vi.fn() }));
vi.mock("@/lib/server/jobs/job-store/recovery", () => ({
  clearFalseSatisfiedStamp: vi.fn(),
  recoverReleasedFromFlutterwave: vi.fn(),
}));
const shopPay = vi.hoisted(() => ({ verifyShopPayment: vi.fn() }));
vi.mock("@/lib/server/shop/payments", () => shopPay);

import {
  isShopPaymentReference,
  processPaymentWebhookEvent,
} from "@/lib/server/payments/durable-processing";

function claim(ref: string) {
  db.rpcs.claim_payment_webhook_inbox = () => [
    { id: "evt-1", provider: "flutterwave", provider_ref: ref, status: "processing", attempts: 1 },
  ];
  db.rpcs.drain_job_outbox = () => ({ delivered: 0, failed: 0 });
  db.rpcs.finish_payment_webhook_inbox = (a) => a.p_status;
}
const finished = () => db.rpcCalls.find((c) => c.name === "finish_payment_webhook_inbox")!.args;

beforeEach(() => {
  vi.clearAllMocks();
  db = makeFakeDb();
});

describe("B1: Flutterwave webhook confirms SHOP payments", () => {
  it("recognises shop references", () => {
    expect(isShopPaymentReference("shop_abcd1234_xyz")).toBe(true);
    expect(isShopPaymentReference("ona_job_123")).toBe(false);
  });

  it("a paid shop charge is confirmed by the shop engine, never the job-escrow flow", async () => {
    claim("shop_abcd1234_xyz");
    shopPay.verifyShopPayment.mockResolvedValue({ success: true, orderId: "o" });
    const r = await processPaymentWebhookEvent("evt-1");
    expect(shopPay.verifyShopPayment).toHaveBeenCalledWith({ reference: "shop_abcd1234_xyz" });
    expect(confirmJob.confirmJobPayment).not.toHaveBeenCalled();
    expect(r.status).toBe("processed");
    expect(finished()).toMatchObject({ p_status: "processed" });
  });

  it("job references still go to the job flow (no regression)", async () => {
    claim("job_ref_1");
    confirmJob.confirmJobPayment.mockResolvedValue({ outcome: "confirmed", payment: {}, job: {} });
    await processPaymentWebhookEvent("evt-1");
    expect(confirmJob.confirmJobPayment).toHaveBeenCalled();
    expect(shopPay.verifyShopPayment).not.toHaveBeenCalled();
  });

  it("not-yet-confirmed charge -> retry (webhook is re-queued, not lost)", async () => {
    claim("shop_x");
    shopPay.verifyShopPayment.mockResolvedValue({ success: false, pending: true, orderId: "o" });
    expect((await processPaymentWebhookEvent("evt-1")).status).toBe("retry");
  });

  it("a refunded-because-out-of-stock payment is handled (processed)", async () => {
    claim("shop_x");
    shopPay.verifyShopPayment.mockResolvedValue({ success: false, refunded: true, orderId: "o" });
    expect((await processPaymentWebhookEvent("evt-1")).status).toBe("processed");
  });

  it("a refund the gateway refused goes to MANUAL REVIEW so ops see it", async () => {
    claim("shop_x");
    shopPay.verifyShopPayment.mockResolvedValue({ success: false, refundPending: true, orderId: "o" });
    expect((await processPaymentWebhookEvent("evt-1")).status).toBe("manual_review");
  });

  it("amount mismatch -> manual review; transient errors -> retry", async () => {
    claim("shop_x");
    shopPay.verifyShopPayment.mockRejectedValue(new Error("Payment amount mismatch"));
    expect((await processPaymentWebhookEvent("evt-1")).status).toBe("manual_review");
    claim("shop_x");
    shopPay.verifyShopPayment.mockRejectedValue(new Error("network"));
    expect((await processPaymentWebhookEvent("evt-1")).status).toBe("retry");
  });

  it("definitive failure -> rejected", async () => {
    claim("shop_x");
    shopPay.verifyShopPayment.mockResolvedValue({ success: false, orderId: "o" });
    expect((await processPaymentWebhookEvent("evt-1")).status).toBe("rejected");
  });
});
