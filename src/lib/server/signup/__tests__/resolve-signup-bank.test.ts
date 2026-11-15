import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/test-utils/fake-supabase";
import { stubBankResolve, type FakeBank } from "@/test-utils/fake-bank-resolve";
import type { SignupContext } from "@/lib/server/signup/context";
import { resolveSignupBank } from "@/lib/server/signup/preflight";
import { checkSignupIds } from "@/lib/server/identity/signup-id-check";

vi.mock("@/lib/server/identity/id-lookup", async (orig) => {
  const real = await orig<typeof import("@/lib/server/identity/id-lookup")>();
  return {
    ...real,
    // A live provider confirming the BVN belongs to "Victim Person".
    lookupId: vi.fn(async (kind: "nin" | "bvn", _n: string, names: Parameters<typeof real.buildIdLookupRecord>[2]) =>
      real.buildIdLookupRecord(
        kind,
        { ok: true, provider: "prembly", mode: "live", fullName: "Victim Person", firstName: "Victim", lastName: "Person" } as never,
        names,
      ),
    ),
  };
});

let db: FakeSupabase;
let bank: FakeBank;
const ctxFor = (input: Record<string, unknown>) =>
  ({
    supabase: db,
    input: { fullName: "Victim Person", ...input },
    eventBase: { email: "a@b.test" },
  }) as unknown as SignupContext;

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  db = new FakeSupabase({ signup_events: [] });
  bank = stubBankResolve({ name: "ACTUAL ACCOUNT OWNER" });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const BANK = { bankAccountNumber: "0123456789", bankCode: "058", bankName: "GTBank" };

describe("resolveSignupBank", () => {
  it("replaces the typed name with the bank's and stamps when it was confirmed", async () => {
    const ctx = ctxFor({ ...BANK, bankAccountName: "Victim Person" });
    expect(await resolveSignupBank(ctx)).toBeNull();
    expect(ctx.input.bankAccountName).toBe("ACTUAL ACCOUNT OWNER");
    expect(ctx.bankResolvedAt).toBeTruthy();
  });

  it("typing the BVN holder's name no longer produces a bank-account match", async () => {
    const ctx = ctxFor({ ...BANK, bankAccountName: "Victim Person" });
    await resolveSignupBank(ctx);
    const check = await checkSignupIds({
      bvn: "12345678901",
      profileName: ctx.input.fullName,
      bankAccountName: ctx.input.bankAccountName,
    });
    expect(check.ok && check.records[0].nameMatch).toEqual({ profile: "match", bankAccount: "mismatch" });
  });

  it("bank unreachable: signup continues with no name, and the comparison is unknown", async () => {
    bank.mode = "unavailable";
    const ctx = ctxFor({ ...BANK, bankAccountName: "Victim Person" });
    expect(await resolveSignupBank(ctx)).toBeNull();
    expect(ctx.input.bankAccountName).toBeUndefined();
    expect(ctx.bankResolvedAt).toBeNull();
    const check = await checkSignupIds({
      bvn: "12345678901",
      profileName: ctx.input.fullName,
      bankAccountName: ctx.input.bankAccountName,
    });
    expect(check.ok && check.records[0].nameMatch.bankAccount).toBe("unknown");
  });

  it("an account the bank does not know stops signup", async () => {
    bank.mode = "not_found";
    const res = await resolveSignupBank(ctxFor({ ...BANK, bankAccountName: "Victim Person" }));
    expect(res?.status).toBe(422);
    expect((await res!.json()).error.code).toBe("bank_account_not_found");
  });

  it("no bank details, or incomplete ones: the typed name is dropped and the bank is not asked", async () => {
    for (const input of [{ bankAccountName: "Typed Name" }, { bankAccountNumber: "123", bankCode: "058", bankAccountName: "Typed Name" }]) {
      const ctx = ctxFor(input);
      expect(await resolveSignupBank(ctx)).toBeNull();
      expect(ctx.input.bankAccountName).toBeUndefined();
      expect(ctx.bankResolvedAt).toBeNull();
    }
    expect(bank.calls).toHaveLength(0);
  });
});
