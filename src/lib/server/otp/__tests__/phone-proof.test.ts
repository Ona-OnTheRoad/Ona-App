import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isPhoneProofConfigured, issuePhoneProof, PHONE_PROOF_TTL_MS, verifyPhoneProof } from "../phone-proof";

const PHONE = "+2348031234567";
const saved = { a: process.env.OTP_PROOF_SECRET, b: process.env.SUPABASE_SERVICE_ROLE_KEY };

beforeEach(() => {
  process.env.OTP_PROOF_SECRET = "test-secret-one";
});
afterEach(() => {
  if (saved.a === undefined) delete process.env.OTP_PROOF_SECRET;
  else process.env.OTP_PROOF_SECRET = saved.a;
  if (saved.b === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = saved.b;
});

describe("phone proof", () => {
  it("accepts a fresh proof for the exact number it was issued for", () => {
    const { proof } = issuePhoneProof(PHONE);
    expect(verifyPhoneProof(proof, PHONE)).toBe(true);
  });

  it("rejects it for any other number", () => {
    const { proof } = issuePhoneProof(PHONE);
    expect(verifyPhoneProof(proof, "+2348039999999")).toBe(false);
    expect(verifyPhoneProof(proof, "08031234567")).toBe(false);
  });

  it("expires after 2 hours (long enough for the Repair Pro wizard)", () => {
    const now = 1_000_000;
    const { proof } = issuePhoneProof(PHONE, now);
    expect(verifyPhoneProof(proof, PHONE, now + PHONE_PROOF_TTL_MS - 1)).toBe(true);
    expect(verifyPhoneProof(proof, PHONE, now + PHONE_PROOF_TTL_MS)).toBe(false);
  });

  it("detects tampering with the payload or the signature", () => {
    const { proof } = issuePhoneProof(PHONE);
    const [body, sig] = proof.split(".");
    // Re-point the proof at another number and keep the old signature.
    const forged = Buffer.from(
      JSON.stringify({ p: "+2348039999999", exp: Date.now() + 60_000, n: "x" }),
    ).toString("base64url");
    expect(verifyPhoneProof(`${forged}.${sig}`, "+2348039999999")).toBe(false);
    expect(verifyPhoneProof(`${body}.${sig.slice(0, -2)}AA`, PHONE)).toBe(false);
  });

  it("is not valid under a different secret", () => {
    const { proof } = issuePhoneProof(PHONE);
    process.env.OTP_PROOF_SECRET = "a-different-secret";
    expect(verifyPhoneProof(proof, PHONE)).toBe(false);
  });

  it("rejects garbage without throwing", () => {
    for (const bad of ["", "abc", "a.b.c", ".", "x.y", null, undefined]) {
      expect(verifyPhoneProof(bad as string, PHONE)).toBe(false);
    }
  });

  it("falls back to the service-role key when no dedicated secret is set", () => {
    delete process.env.OTP_PROOF_SECRET;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    const { proof } = issuePhoneProof(PHONE);
    expect(verifyPhoneProof(proof, PHONE)).toBe(true);
  });

  it("never issues a proof without any secret, and verifying then fails closed", () => {
    const { proof } = issuePhoneProof(PHONE);
    delete process.env.OTP_PROOF_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => issuePhoneProof(PHONE)).toThrow(/secret/i);
    expect(verifyPhoneProof(proof, PHONE)).toBe(false);
  });

  it("issues different tokens each time", () => {
    expect(issuePhoneProof(PHONE).proof).not.toBe(issuePhoneProof(PHONE).proof);
  });
});

describe("isPhoneProofConfigured", () => {
  it("is true with a dedicated secret or the service-role key, false with neither", () => {
    expect(isPhoneProofConfigured()).toBe(true);
    delete process.env.OTP_PROOF_SECRET;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    expect(isPhoneProofConfigured()).toBe(true);
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(isPhoneProofConfigured()).toBe(false);
    process.env.OTP_PROOF_SECRET = "   ";
    expect(isPhoneProofConfigured()).toBe(false);
  });

  it("outlives a 30 minute wizard", () => {
    expect(PHONE_PROOF_TTL_MS).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000);
  });
});
