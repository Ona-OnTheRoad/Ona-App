import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  isBankAccountTaken,
  loadIdentityCheck,
  loadMotoristBankCode,
  loadMotoristBankDetails,
  loadProBankCode,
  loadProBankDetails,
} from "@/lib/server/payments/bank-lookup";

const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

type TableResult = { data: unknown; error?: { message: string } | null };

function makeSb(byTable: Record<string, TableResult | TableResult[]>) {
  const calls: Record<string, number> = {};
  const sb = {
    from: vi.fn((table: string) => {
      const n = calls[table] || 0;
      calls[table] = n + 1;
      const result = byTable[table];
      const row = Array.isArray(result) ? result[n] : result;
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => row),
            limit: vi.fn(async () => row),
          })),
        })),
      };
    }),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("loadMotoristBankCode / loadProBankCode", () => {
  it("returns the bank code when present", async () => {
    makeSb({ motorist_profiles: { data: { bank_code: "058" } } });
    expect(await loadMotoristBankCode("u1")).toBe("058");
  });

  it("returns null when admin isn't configured", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);
    expect(await loadProBankCode("u1")).toBeNull();
    expect(createServiceSupabaseMock).not.toHaveBeenCalled();
  });
});

describe("loadMotoristBankDetails", () => {
  it("normalizes the account number and trims the bank code", async () => {
    makeSb({
      motorist_profiles: {
        data: {
          bank_name: "GTB",
          bank_account_name: "Jane Doe",
          bank_account_number: "012-345-6789",
          bank_code: " 058 ",
        },
      },
    });
    expect(await loadMotoristBankDetails("u1")).toEqual({
      bankName: "GTB",
      accountName: "Jane Doe",
      accountNumber: "0123456789",
      bankCode: "058",
    });
  });

  it("returns null when no row exists", async () => {
    makeSb({ motorist_profiles: { data: null } });
    expect(await loadMotoristBankDetails("u1")).toBeNull();
  });
});

describe("loadProBankDetails", () => {
  it("returns null when repairProId is null", async () => {
    expect(await loadProBankDetails(null)).toBeNull();
    expect(createServiceSupabaseMock).not.toHaveBeenCalled();
  });

  it("returns null when the account number is too short", async () => {
    makeSb({
      repair_pro_profiles: {
        data: { bank_code: "058", bank_account_number: "123", bank_account_name: "X" },
      },
    });
    expect(await loadProBankDetails("pro-1")).toBeNull();
  });
});

describe("loadIdentityCheck", () => {
  it("combines profiles.full_name with the role table's nin/bvn last4", async () => {
    makeSb({
      profiles: { data: { full_name: "Jane Doe" } },
      motorist_profiles: { data: { nin_last4: "1234", bvn_last4: "5678" } },
    });
    expect(await loadIdentityCheck("u1", "motorist")).toEqual({
      fullName: "Jane Doe",
      ninLast4: "1234",
      bvnLast4: "5678",
    });
  });
});

describe("isBankAccountTaken", () => {
  it("matches on motorist_profiles", async () => {
    makeSb({
      motorist_profiles: {
        data: [{ user_id: "other", bank_code: "058", bank_account_number: "0123456789" }],
      },
      repair_pro_profiles: { data: [] },
      payout_methods: { data: [] },
    });
    expect(
      await isBankAccountTaken({ accountNumber: "0123456789", bankCode: "058" }),
    ).toBe(true);
  });

  it("excludes the caller's own matching row", async () => {
    makeSb({
      motorist_profiles: {
        data: [{ user_id: "me", bank_code: "058", bank_account_number: "0123456789" }],
      },
      repair_pro_profiles: { data: [] },
      payout_methods: { data: [] },
    });
    expect(
      await isBankAccountTaken({
        accountNumber: "0123456789",
        bankCode: "058",
        excludeUserId: "me",
      }),
    ).toBe(false);
  });

  it("matches on payout_methods by bank_code + last4", async () => {
    makeSb({
      motorist_profiles: { data: [] },
      repair_pro_profiles: { data: [] },
      payout_methods: {
        data: [{ user_id: "other", bank_code: "058", account_number_last4: "6789" }],
      },
    });
    expect(
      await isBankAccountTaken({ accountNumber: "0123456789", bankCode: "058" }),
    ).toBe(true);
  });

  it("returns false for a non-10-digit account number without querying", async () => {
    expect(
      await isBankAccountTaken({ accountNumber: "123", bankCode: "058" }),
    ).toBe(false);
    expect(createServiceSupabaseMock).not.toHaveBeenCalled();
  });
});
