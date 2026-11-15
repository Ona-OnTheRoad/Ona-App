import { afterEach, describe, expect, it, vi } from "vitest";
import { stubBankResolve } from "@/test-utils/fake-bank-resolve";
import { bankNameForSave, resolveBankAccount } from "@/lib/server/payments/resolve-account";

const ACCOUNT = { accountNumber: "0123456789", bankCode: "058" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("resolveBankAccount", () => {
  it("returns the holder name the bank gives", async () => {
    const bank = stubBankResolve({ name: "  JANE A DOE " });
    expect(await resolveBankAccount({ ...ACCOUNT, accountNumber: "012-345-6789" })).toEqual({
      status: "resolved",
      accountName: "JANE A DOE",
      accountNumber: "0123456789",
      bankCode: "058",
      source: "flutterwave",
    });
    expect(bank.calls).toEqual([{ account_number: "0123456789", account_bank: "058" }]);
  });

  it("not_found when the bank refuses the account", async () => {
    stubBankResolve({ mode: "not_found" });
    expect((await resolveBankAccount(ACCOUNT)).status).toBe("not_found");
  });

  it("not_found without asking when the number or bank code is unusable", async () => {
    const bank = stubBankResolve();
    expect((await resolveBankAccount({ accountNumber: "123", bankCode: "058" })).status).toBe("not_found");
    expect((await resolveBankAccount({ accountNumber: "0123456789", bankCode: " " })).status).toBe("not_found");
    expect(bank.calls).toHaveLength(0);
  });

  it("unavailable on a provider error, a network failure, throttling or a bad key", async () => {
    stubBankResolve({ mode: "unavailable" });
    expect(await resolveBankAccount(ACCOUNT)).toMatchObject({ status: "unavailable", code: "provider_error" });
    stubBankResolve({ mode: "network" });
    expect(await resolveBankAccount(ACCOUNT)).toMatchObject({ status: "unavailable", code: "provider_error" });
    for (const status of [401, 403, 429]) {
      vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status })));
      expect((await resolveBankAccount(ACCOUNT)).status).toBe("unavailable");
    }
  });

  it("unavailable when no key is configured", async () => {
    vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "");
    expect(await resolveBankAccount(ACCOUNT)).toMatchObject({ status: "unavailable", code: "no_keys" });
  });
});

describe("development stand-in", () => {
  it("accepts the supplied name only with no key on a non-production runtime", async () => {
    vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL", "");
    expect(await resolveBankAccount({ ...ACCOUNT, devStandInName: "Typed Name" })).toMatchObject({
      status: "resolved",
      accountName: "Typed Name",
      source: "dev_stand_in",
    });
  });

  it("is refused in production and on preview deployments", async () => {
    vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    expect((await resolveBankAccount({ ...ACCOUNT, devStandInName: "Typed Name" })).status).toBe("unavailable");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await resolveBankAccount({ ...ACCOUNT, devStandInName: "Typed Name" })).status).toBe("unavailable");
  });

  it("is ignored whenever a key is set: the bank's answer wins", async () => {
    vi.stubEnv("NODE_ENV", "development");
    stubBankResolve({ name: "BANK SAYS THIS" });
    expect(await resolveBankAccount({ ...ACCOUNT, devStandInName: "Typed Name" })).toMatchObject({
      accountName: "BANK SAYS THIS",
      source: "flutterwave",
    });
    stubBankResolve({ mode: "unavailable" });
    expect((await resolveBankAccount({ ...ACCOUNT, devStandInName: "Typed Name" })).status).toBe("unavailable");
  });
});

describe("bankNameForSave", () => {
  it("never returns the typed name when the bank answers", async () => {
    stubBankResolve({ name: "REAL HOLDER" });
    const d = await bankNameForSave({ ...ACCOUNT, typedName: "Someone Else", onUnavailable: "reject" });
    expect(d).toMatchObject({ ok: true, accountName: "REAL HOLDER" });
    expect(d.ok && d.resolvedAt).toBeTruthy();
  });

  it("refuses an unknown account in both modes", async () => {
    stubBankResolve({ mode: "not_found" });
    for (const onUnavailable of ["reject", "save_unresolved"] as const) {
      expect(await bankNameForSave({ ...ACCOUNT, typedName: "X Y", onUnavailable })).toMatchObject({
        ok: false,
        status: 422,
        code: "bank_account_not_found",
      });
    }
  });

  it("bank unreachable: no name when saving unresolved, refusal when rejecting", async () => {
    vi.stubEnv("NODE_ENV", "production");
    stubBankResolve({ mode: "unavailable" });
    expect(await bankNameForSave({ ...ACCOUNT, typedName: "Typed Name", onUnavailable: "save_unresolved" })).toEqual({
      ok: true,
      accountName: null,
      resolvedAt: null,
    });
    expect(await bankNameForSave({ ...ACCOUNT, typedName: "Typed Name", onUnavailable: "reject" })).toMatchObject({
      ok: false,
      status: 503,
      code: "bank_lookup_unavailable",
    });
  });
});
