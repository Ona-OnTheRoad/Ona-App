import { beforeEach, describe, expect, it, vi } from "vitest";

const af = vi.hoisted(() => ({ authFetch: vi.fn() }));
vi.mock("@/lib/api-auth-headers", () => ({ authFetch: (...a: unknown[]) => af.authFetch(...a) }));

import { changeBankAccount, sendBankChangeCode, verifyBankChangeCode } from "./change-bank-client";

const reply = (body: unknown) => af.authFetch.mockResolvedValue({ json: async () => body });
const bank = { bankName: "GTBank", bankAccountName: "Ada", bankAccountNumber: "0123456789", bankCode: "058" };
beforeEach(() => { af.authFetch.mockReset(); });

describe("sendBankChangeCode", () => {
  it("posts an empty body (the server reads the phone from the account)", async () => {
    reply({ ok: true, data: { resendInSec: 45, phone: "+2348***678" } });
    expect(await sendBankChangeCode()).toEqual({ ok: true, resendInSec: 45, phone: "+2348***678" });
    expect(af.authFetch.mock.calls[0][0]).toBe("/api/security/change-bank/send-code");
    expect(JSON.parse(af.authFetch.mock.calls[0][1].body)).toEqual({});
  });
  it("returns the server's message and code on failure", async () => {
    reply({ ok: false, error: { message: "no phone", code: "no_phone" } });
    expect(await sendBankChangeCode()).toEqual({ ok: false, error: "no phone", code: "no_phone" });
  });
  it("handles a network error without throwing", async () => {
    af.authFetch.mockImplementation(async () => { throw new Error("offline"); });
    expect(await sendBankChangeCode()).toEqual({ ok: false, error: "Network error. Try again." });
  });
});

describe("verifyBankChangeCode", () => {
  it("returns the proof", async () => {
    reply({ ok: true, data: { bankProof: "P" } });
    expect(await verifyBankChangeCode("123456")).toEqual({ ok: true, bankProof: "P" });
    expect(JSON.parse(af.authFetch.mock.calls[0][1].body)).toEqual({ code: "123456" });
  });
  it("treats a success response WITHOUT a proof as a failure", async () => {
    reply({ ok: true, data: {} });
    expect(await verifyBankChangeCode("123456")).toMatchObject({ ok: false });
  });
  it("surfaces the server error", async () => {
    reply({ ok: false, error: { message: "Incorrect code. Try again.", code: "otp_invalid" } });
    expect(await verifyBankChangeCode("1")).toEqual({ ok: false, error: "Incorrect code. Try again.", code: "otp_invalid" });
  });
});

describe("changeBankAccount", () => {
  it("posts change_bank with the details and the proof", async () => {
    reply({ ok: true, data: { updated: true } });
    expect(await changeBankAccount({ accessToken: "tok", bank, bankProof: "P" })).toEqual({ ok: true });
    const body = JSON.parse(af.authFetch.mock.calls[0][1].body);
    expect(af.authFetch.mock.calls[0][0]).toBe("/api/security/action");
    expect(body).toMatchObject({ action: "change_bank", accessToken: "tok", bankProof: "P" });
    expect(JSON.parse(body.newValue)).toEqual(bank);
  });
  it("returns the code so the UI can route on it", async () => {
    reply({ ok: false, error: { message: "verify", code: "verification_required" } });
    expect(await changeBankAccount({ accessToken: "tok", bank, bankProof: "" })).toEqual({ ok: false, error: "verify", code: "verification_required" });
  });
});
