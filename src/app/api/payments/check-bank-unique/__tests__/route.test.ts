import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
  getSupabaseUrl: vi.fn(() => "http://localhost"),
  getSupabaseAnonKey: vi.fn(() => "anon"),
}));

vi.mock("@/lib/server/payments/bank-lookup", () => ({
  isBankAccountTaken: vi.fn(),
}));

const getUserMock = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { getUser: getUserMock } })),
}));

import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { isBankAccountTaken } from "@/lib/server/payments/bank-lookup";
import { POST } from "@/app/api/payments/check-bank-unique/route";

const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const isBankAccountTakenMock = vi.mocked(isBankAccountTaken);

function req(body: unknown) {
  return new Request("http://localhost/api/payments/check-bank-unique", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
  getUserMock.mockResolvedValue({ data: { user: null } });
});

describe("POST /api/payments/check-bank-unique", () => {
  it("delegates the uniqueness check to the shared adapter", async () => {
    isBankAccountTakenMock.mockResolvedValue(false);

    const res = await POST(req({ accountNumber: "0123456789", bankCode: "058" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ available: true });
    expect(isBankAccountTakenMock).toHaveBeenCalledWith({
      accountNumber: "0123456789",
      bankCode: "058",
      excludeUserId: null,
    });
  });

  it("reports unavailable when the adapter finds a match", async () => {
    isBankAccountTakenMock.mockResolvedValue(true);

    const res = await POST(req({ accountNumber: "0123456789", bankCode: "058" }));
    const json = await res.json();

    expect(json.data.available).toBe(false);
  });

  it("resolves the caller's own id from access_token and excludes it from the match", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    isBankAccountTakenMock.mockResolvedValue(false);

    await POST(
      req({ accountNumber: "0123456789", bankCode: "058", access_token: "tok" }),
    );

    expect(isBankAccountTakenMock).toHaveBeenCalledWith(
      expect.objectContaining({ excludeUserId: "user-1" }),
    );
  });

  it("returns 503 when Supabase admin isn't configured", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    const res = await POST(req({ accountNumber: "0123456789", bankCode: "058" }));
    expect(res.status).toBe(503);
    expect(isBankAccountTakenMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed account number", async () => {
    const res = await POST(req({ accountNumber: "123", bankCode: "058" }));
    expect(res.status).toBe(400);
  });
});
