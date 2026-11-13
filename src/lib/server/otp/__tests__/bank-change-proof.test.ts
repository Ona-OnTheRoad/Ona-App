import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BANK_CHANGE_PROOF_TTL_MS, issueBankChangeProof, verifyBankChangeProof } from "../bank-change-proof";
import { issueIdentityProof, verifyIdentityProof } from "../identity-proof";
import { issuePhoneProof, verifyPhoneProof } from "../phone-proof";
import { bankChangeKey } from "../bank-change-otp";
import { changeContactKey } from "../change-contact-otp";
import { signupOtpKey } from "../signup-otp";

const saved = { a: process.env.OTP_PROOF_SECRET, b: process.env.SUPABASE_SERVICE_ROLE_KEY };
beforeEach(() => { process.env.OTP_PROOF_SECRET = "s1"; delete process.env.SUPABASE_SERVICE_ROLE_KEY; });
afterEach(() => {
  if (saved.a === undefined) delete process.env.OTP_PROOF_SECRET; else process.env.OTP_PROOF_SECRET = saved.a;
  if (saved.b === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = saved.b;
});

describe("bank change proof", () => {
  it("verifies for its user within the TTL, then expires", () => {
    const { proof, expiresAt } = issueBankChangeProof("u1", 1_000);
    expect(expiresAt).toBe(1_000 + BANK_CHANGE_PROOF_TTL_MS);
    expect(verifyBankChangeProof(proof, "u1", 2_000)).toBe(true);
    expect(verifyBankChangeProof(proof, "u1", expiresAt)).toBe(false);
  });
  it("is bound to the user and rejects tampering and garbage without throwing", () => {
    const { proof } = issueBankChangeProof("u1");
    expect(verifyBankChangeProof(proof, "u2")).toBe(false);
    for (const bad of [proof.slice(0, -2) + "xx", "a.b", "garbage", "", null, undefined]) {
      expect(verifyBankChangeProof(bad as string, "u1")).toBe(false);
    }
  });
  it("fails closed with no secret", () => {
    const { proof } = issueBankChangeProof("u1");
    delete process.env.OTP_PROOF_SECRET;
    expect(verifyBankChangeProof(proof, "u1")).toBe(false);
  });
});

describe("proof kinds are not interchangeable", () => {
  it("a proof of one kind never verifies as another", () => {
    const bank = issueBankChangeProof("u1").proof;
    const identity = issueIdentityProof("u1").proof;
    expect(verifyIdentityProof(bank, "u1")).toBe(false);
    expect(verifyBankChangeProof(identity, "u1")).toBe(false);
    expect(verifyBankChangeProof(issuePhoneProof("u1").proof, "u1")).toBe(false);
    expect(verifyPhoneProof(bank, "u1")).toBe(false);
  });
});

describe("one-time code namespaces", () => {
  it("bank codes never collide with contact-change, signup or login keys", () => {
    const phone = "+2348012345678";
    const k = bankChangeKey("u1", phone);
    expect(k.startsWith("bank:")).toBe(true);
    for (const other of [phone, signupOtpKey(phone), changeContactKey("u1", "phone", phone), `email:${phone}`]) {
      expect(k).not.toBe(other);
    }
    expect(bankChangeKey("u2", phone)).not.toBe(k);
  });
});
