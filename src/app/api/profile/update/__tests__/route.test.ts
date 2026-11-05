import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  isBankAccountTaken: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
  getSupabaseUrl: vi.fn(() => "http://localhost"),
  getSupabaseAnonKey: vi.fn(() => "anon"),
}));

vi.mock("@/lib/server/payments/bank-lookup", () => ({
  isBankAccountTaken: mocks.isBankAccountTaken,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(() => ({
    from: mocks.from,
  })),
}));

import { POST } from "../route";

function makeReq(body: Record<string, unknown>) {
  return new Request("http://localhost/api/profile/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "user-123" } },
    error: null,
  });

  mocks.from.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { role: "motorist", full_name: "Test User" },
      error: null,
    }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });
});

describe("POST /api/profile/update bank uniqueness integration", () => {
  it("delegates to isBankAccountTaken and rejects with 409 when bank account is taken", async () => {
    mocks.isBankAccountTaken.mockResolvedValue(true);

    const res = await POST(
      makeReq({
        access_token: "mock-valid-access-token",
        bankCode: "058",
        bankAccountNumber: "0123456789",
        bankName: "GTBank",
        bankAccountName: "John Doe",
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error.code).toBe("bank_account_in_use");
    expect(mocks.isBankAccountTaken).toHaveBeenCalledWith({
      accountNumber: "0123456789",
      bankCode: "058",
      excludeUserId: "user-123",
    });
  });

  it("passes when isBankAccountTaken returns false (available or own bank)", async () => {
    mocks.isBankAccountTaken.mockResolvedValue(false);

    const res = await POST(
      makeReq({
        access_token: "mock-valid-access-token",
        bankCode: "058",
        bankAccountNumber: "0123456789",
        bankName: "GTBank",
        bankAccountName: "John Doe",
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mocks.isBankAccountTaken).toHaveBeenCalledWith({
      accountNumber: "0123456789",
      bankCode: "058",
      excludeUserId: "user-123",
    });
  });
});
