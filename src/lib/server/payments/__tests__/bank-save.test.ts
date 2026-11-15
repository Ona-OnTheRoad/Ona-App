import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";
import { stubBankResolve, type FakeBank } from "@/test-utils/fake-bank-resolve";
import { confirmedBankName, planBankNameColumns } from "@/lib/server/payments/bank-save";

const LEGACY = { bank_code: "058", bank_account_number: "0123456789", bank_account_name: "Typed By User" };
const CONFIRMED = { ...LEGACY, bank_account_name: "BANK HOLDER", bank_account_resolved_at: "2026-11-01T00:00:00.000Z" };
const BVN_META = {
  idLookup: {
    bvn: {
      kind: "bvn",
      status: "verified",
      matchedName: "Victim Person",
      nameMatch: { profile: "match", bankAccount: "match" },
    },
  },
};

let db: FakeSupabase;
let bank: FakeBank;
const admin = () => db as never;
const pro = () => (db.rows.repair_pro_profiles as Row[])[0];
const mot = () => (db.rows.motorist_profiles as Row[])[0];
const seed = (proRow: Row | null, motRow: Row | null = null) => {
  db = new FakeSupabase({
    repair_pro_profiles: proRow ? [{ user_id: "u1", ...proRow }] : [],
    motorist_profiles: motRow ? [{ user_id: "u1", ...motRow }] : [],
  });
};

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.spyOn(console, "error").mockImplementation(() => {});
  bank = stubBankResolve({ name: "BANK HOLDER" });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("confirmedBankName (what a payout may use)", () => {
  it("returns a confirmed name without asking the bank again", async () => {
    seed(CONFIRMED);
    expect(await confirmedBankName(admin(), "u1", pro())).toBe("BANK HOLDER");
    expect(bank.calls).toHaveLength(0);
  });

  it("a legacy typed name is replaced by the bank's answer and stamped on both role rows", async () => {
    seed({ ...LEGACY, gov_id_meta: BVN_META }, LEGACY);
    expect(await confirmedBankName(admin(), "u1", pro())).toBe("BANK HOLDER");
    for (const row of [pro(), mot()]) {
      expect(row.bank_account_name).toBe("BANK HOLDER");
      expect(row.bank_account_resolved_at).toBeTruthy();
    }
    // The typed name had been recorded as matching the BVN holder; the bank's name does not.
    const meta = pro().gov_id_meta as typeof BVN_META;
    expect(meta.idLookup.bvn.nameMatch).toEqual({ profile: "match", bankAccount: "mismatch" });
  });

  it("does not stamp a role row that holds a different account", async () => {
    seed(LEGACY, { ...LEGACY, bank_account_number: "1111111111" });
    await confirmedBankName(admin(), "u1", pro());
    expect(mot().bank_account_name).toBe("Typed By User");
    expect(mot().bank_account_resolved_at).toBeUndefined();
  });

  it("returns null and changes nothing when the bank cannot be asked or refuses", async () => {
    for (const mode of ["unavailable", "network", "not_found"] as const) {
      seed(LEGACY);
      bank.mode = mode;
      expect(await confirmedBankName(admin(), "u1", pro())).toBeNull();
      expect(pro().bank_account_name).toBe("Typed By User");
      expect(pro().bank_account_resolved_at).toBeUndefined();
    }
  });

  it("returns null for an incomplete account without asking", async () => {
    seed({ ...LEGACY, bank_account_number: "123" });
    expect(await confirmedBankName(admin(), "u1", pro())).toBeNull();
    expect(await confirmedBankName(admin(), "u1", null)).toBeNull();
    expect(bank.calls).toHaveLength(0);
  });
});

describe("planBankNameColumns (generic profile save)", () => {
  const plan = (patch: Parameters<typeof planBankNameColumns>[3], isPro = true) =>
    planBankNameColumns(admin(), "u1", isPro, patch);

  it("a name-only patch writes nothing and does not ask the bank", async () => {
    seed(CONFIRMED);
    expect(await plan({ bankAccountName: "Attacker Name" })).toEqual({ ok: true, columns: {} });
    expect(bank.calls).toHaveLength(0);
  });

  it("first-time setup stores the bank's name, not the typed one", async () => {
    seed({});
    const r = await plan({ bankAccountNumber: "0123456789", bankCode: "058", bankAccountName: "Attacker Name" });
    expect(r).toMatchObject({ ok: true, columns: { bank_account_name: "BANK HOLDER" } });
    expect(r.ok && r.columns.bank_account_resolved_at).toBeTruthy();
  });

  it("the same confirmed account is kept without a lookup, typed name ignored", async () => {
    seed(CONFIRMED);
    expect(await plan({ bankAccountNumber: "0123456789", bankCode: "058", bankAccountName: "Attacker Name" })).toEqual({
      ok: true,
      columns: { bank_account_name: "BANK HOLDER", bank_account_resolved_at: CONFIRMED.bank_account_resolved_at },
    });
    expect(bank.calls).toHaveLength(0);
  });

  it("reuses the confirmed name from the other role's row", async () => {
    seed({}, CONFIRMED);
    expect(await plan({ bankAccountNumber: "0123456789", bankCode: "058" })).toMatchObject({
      ok: true,
      columns: { bank_account_name: "BANK HOLDER" },
    });
    expect(bank.calls).toHaveLength(0);
  });

  it("a legacy row for the same account is confirmed on the next save", async () => {
    seed(LEGACY);
    expect(await plan({ bankAccountNumber: "0123456789", bankCode: "058", bankAccountName: "Typed By User" })).toMatchObject({
      ok: true,
      columns: { bank_account_name: "BANK HOLDER" },
    });
  });

  it("rejects an account the bank does not know", async () => {
    seed({});
    bank.mode = "not_found";
    const r = await plan({ bankAccountNumber: "0123456789", bankCode: "058", bankAccountName: "Any Name" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(422);
      expect((await r.response.json()).error.code).toBe("bank_account_not_found");
    }
  });

  it("bank unreachable: a new account is saved with no name; a legacy row is left alone", async () => {
    bank.mode = "unavailable";
    seed({});
    expect(await plan({ bankAccountNumber: "0123456789", bankCode: "058", bankAccountName: "Typed Name" })).toEqual({
      ok: true,
      columns: { bank_account_name: null, bank_account_resolved_at: null },
    });
    seed(LEGACY);
    expect(await plan({ bankAccountNumber: "0123456789", bankCode: "058", bankAccountName: "Other Typed" })).toEqual({
      ok: true,
      columns: {},
    });
  });

  it("an incomplete account clears the name", async () => {
    seed({});
    expect(await plan({ bankAccountNumber: "12345", bankAccountName: "Typed Name" })).toEqual({
      ok: true,
      columns: { bank_account_name: null, bank_account_resolved_at: null },
    });
    expect(bank.calls).toHaveLength(0);
  });
});
