import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/server/payments/bank-lookup", () => ({
  loadMotoristBankDetails: vi.fn(),
}));

vi.mock("@/lib/server/payments/escrow-store", () => ({
  getEscrowByRequest: vi.fn(),
  updateEscrow: vi.fn(),
}));

vi.mock("@/lib/server/payments/providers", () => ({
  attemptFlutterwaveRefund: vi.fn(),
}));

import { requireUser } from "@/lib/server/auth-utils";
import { loadMotoristBankDetails } from "@/lib/server/payments/bank-lookup";
import {
  getEscrowByRequest,
  updateEscrow,
} from "@/lib/server/payments/escrow-store";
import { attemptFlutterwaveRefund } from "@/lib/server/payments/providers";
import { POST } from "@/app/api/payments/refund/route";

const requireUserMock = vi.mocked(requireUser);
const loadMotoristBankDetailsMock = vi.mocked(loadMotoristBankDetails);
const getEscrowByRequestMock = vi.mocked(getEscrowByRequest);
const updateEscrowMock = vi.mocked(updateEscrow);
const attemptFlutterwaveRefundMock = vi.mocked(attemptFlutterwaveRefund);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req(body: unknown) {
  return new Request("http://localhost/api/payments/refund", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer t" },
    body: JSON.stringify(body),
  });
}

const basePayment = {
  id: "pay-1",
  motoristId: "motorist-1",
  repairProId: "pro-1",
  escrowStatus: "held",
  providerRef: null,
  provider: "mock",
  amountMinor: 500000,
  meta: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  getEscrowByRequestMock.mockResolvedValue(basePayment as never);
  loadMotoristBankDetailsMock.mockResolvedValue({
    bankName: "GTB",
    accountName: "Mo Torist",
    accountNumber: "0123456789",
    bankCode: "058",
  });
  updateEscrowMock.mockImplementation(async (id, patch) => ({
    id,
    ...patch,
  }) as never);
});

describe("POST /api/payments/refund", () => {
  it("looks up the customer's bank via the shared adapter and records it on the refund meta", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));

    const res = await POST(req({ requestId: "req-1", userId: "motorist-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(loadMotoristBankDetailsMock).toHaveBeenCalledWith("motorist-1");
    expect(json.data.customerBankReady).toBe(true);
    expect(updateEscrowMock).toHaveBeenCalledWith(
      "pay-1",
      expect.objectContaining({
        meta: expect.objectContaining({
          customerBankCode: "058",
          customerAccountLast4: "6789",
        }),
      }),
    );
  });

  it("rejects a caller who isn't the motorist or repair pro on the payment", async () => {
    requireUserMock.mockResolvedValue(authOk("someone-else"));

    const res = await POST(req({ requestId: "req-1", userId: "someone-else" }));
    expect(res.status).toBe(403);
  });

  it("returns 400 when the escrow was already released", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    getEscrowByRequestMock.mockResolvedValue({
      ...basePayment,
      escrowStatus: "released",
    } as never);

    const res = await POST(req({ requestId: "req-1", userId: "motorist-1" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("already_released");
  });

  it("attempts a gateway refund when a provider ref exists", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    getEscrowByRequestMock.mockResolvedValue({
      ...basePayment,
      provider: "flutterwave",
      providerRef: "flw-ref-1",
    } as never);
    attemptFlutterwaveRefundMock.mockResolvedValue({
      ok: true,
      status: "pending",
      raw: {},
    } as never);

    const res = await POST(req({ requestId: "req-1", userId: "motorist-1" }));
    const json = await res.json();

    expect(attemptFlutterwaveRefundMock).toHaveBeenCalledWith(
      expect.objectContaining({ providerRef: "flw-ref-1" }),
    );
    expect(json.data.gatewayStatus).toBe("submitted");
  });
});
