import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IDENTITY_PROOF_TTL_MS, issueIdentityProof, verifyIdentityProof } from "../identity-proof";
import { issuePhoneProof } from "../phone-proof";

const saved = { a: process.env.OTP_PROOF_SECRET, b: process.env.SUPABASE_SERVICE_ROLE_KEY };
beforeEach(() => { process.env.OTP_PROOF_SECRET = "s1"; delete process.env.SUPABASE_SERVICE_ROLE_KEY; });
afterEach(() => {
  if (saved.a === undefined) delete process.env.OTP_PROOF_SECRET; else process.env.OTP_PROOF_SECRET = saved.a;
  if (saved.b === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = saved.b;
});

describe("identity proof", () => {
  it("verifies for the user it was issued to, within the TTL", () => {
    const { proof, expiresAt } = issueIdentityProof("u1", 1_000);
    expect(expiresAt).toBe(1_000 + IDENTITY_PROOF_TTL_MS);
    expect(verifyIdentityProof(proof, "u1", 2_000)).toBe(true);
  });
  it("is bound to the user", () => {
    expect(verifyIdentityProof(issueIdentityProof("u1").proof, "u2")).toBe(false);
  });
  it("expires", () => {
    const { proof } = issueIdentityProof("u1", 1_000);
    expect(verifyIdentityProof(proof, "u1", 1_000 + IDENTITY_PROOF_TTL_MS)).toBe(false);
  });
  it("rejects tampering, garbage and empty values without throwing", () => {
    const { proof } = issueIdentityProof("u1");
    for (const bad of [proof.slice(0, -2) + "xx", "a.b", "garbage", "", null, undefined, `${proof}.extra`]) {
      expect(verifyIdentityProof(bad as string, "u1")).toBe(false);
    }
  });
  it("fails closed when the signing secret changes", () => {
    const { proof } = issueIdentityProof("u1");
    process.env.OTP_PROOF_SECRET = "s2";
    expect(verifyIdentityProof(proof, "u1")).toBe(false);
  });
  it("fails closed (no throw) when no secret is configured", () => {
    const { proof } = issueIdentityProof("u1");
    delete process.env.OTP_PROOF_SECRET;
    expect(verifyIdentityProof(proof, "u1")).toBe(false);
    expect(() => issueIdentityProof("u1")).toThrow();
  });
  it("is domain-separated: a signup phone proof is never an identity proof", () => {
    expect(verifyIdentityProof(issuePhoneProof("+2348012345678").proof, "+2348012345678")).toBe(false);
  });
});
