import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/server/payments/bank-lookup", () => ({
  loadMotoristBankCode: vi.fn(),
  loadProBankCode: vi.fn(),
  loadIdentityCheck: vi.fn(),
}));

vi.mock("@/lib/server/payments/escrow-store", () => ({
  createEscrowPayment: vi.fn(),
}));

vi.mock("@/lib/server/payments/providers", () => ({
  initCharge: vi.fn(),
}));

import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  loadIdentityCheck,
  loadMotoristBankCode,
  loadProBankCode,
} from "@/lib/server/payments/bank-lookup";
import { createEscrowPayment } from "@/lib/server/payments/escrow-store";
import { initCharge } from "@/lib/server/payments/providers";
import { POST } from "@/app/api/payments/init/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const loadMotoristBankCodeMock = vi.mocked(loadMotoristBankCode);
const loadProBankCodeMock = vi.mocked(loadProBankCode);
const loadIdentityCheckMock = vi.mocked(loadIdentityCheck);
const createEscrowPaymentMock = vi.mocked(createEscrowPayment);
const initChargeMock = vi.mocked(initCharge);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req(body: unknown) {
  return new Request("http://localhost/api/payments/init", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer t" },
    body: JSON.stringify(body),
  });
}

const baseBody = {
  requestId: "req-1",
  motoristId: "motorist-1",
  repairProId: "pro-1",
  serviceType: "mechanic",
  email: "mo@example.com",
  baseAmountMajor: 5000,
  countryCode: "NG",
  countryName: "Nigeria",
};

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
  loadMotoristBankCodeMock.mockResolvedValue("058");
  loadProBankCodeMock.mockResolvedValue("044");
  loadIdentityCheckMock.mockImplementation(async (userId) => ({
    fullName: userId === "motorist-1" ? "Mo Torist" : "Jane Pro",
    ninLast4: null,
    bvnLast4: null,
  }));
  initChargeMock.mockResolvedValue({
    provider: "flutterwave",
    reference: "ref-1",
    authorizationUrl: "https://pay.example/ref-1",
  } as never);
  createEscrowPaymentMock.mockResolvedValue({ id: "pay-1" } as never);
});

describe("POST /api/payments/init", () => {
  it("looks up bank codes and identity via the shared adapter, not Supabase directly", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));

    const res = await POST(req(baseBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.paymentId).toBe("pay-1");
    expect(loadMotoristBankCodeMock).toHaveBeenCalledWith("motorist-1");
    expect(loadProBankCodeMock).toHaveBeenCalledWith("pro-1");
    expect(loadIdentityCheckMock).toHaveBeenCalledWith("motorist-1", "motorist");
    expect(loadIdentityCheckMock).toHaveBeenCalledWith("pro-1", "repair_pro");
    expect(createEscrowPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({
          motoristBankCode: "058",
          proBankCode: "044",
        }),
      }),
    );
  });

  it("blocks self-payment when motorist and pro identity match", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    loadIdentityCheckMock.mockResolvedValue({
      fullName: "Same Person",
      ninLast4: "1234",
      bvnLast4: "5678",
    });

    const res = await POST(req(baseBody));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("self_payment_blocked");
    expect(createEscrowPaymentMock).not.toHaveBeenCalled();
  });

  it("rejects a motoristId that doesn't match the session", async () => {
    requireUserMock.mockResolvedValue(authOk("someone-else"));

    const res = await POST(req(baseBody));
    expect(res.status).toBe(403);
  });

  it("rejects a body missing required fields", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));

    const res = await POST(req({ ...baseBody, baseAmountMajor: undefined }));
    expect(res.status).toBe(400);
    expect(createEscrowPaymentMock).not.toHaveBeenCalled();
  });
});
