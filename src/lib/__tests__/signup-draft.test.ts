// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  carriedPhoneProof,
  clearSignupDraft,
  loadSignupDraft,
  saveSignupDraft,
  signupHref,
  SIGNUP_DRAFT_KEY,
  type SignupDraft,
} from "../signup-draft";

const draft: SignupDraft = {
  firstName: "Ada",
  lastName: "Okafor",
  email: "ada@example.com",
  phoneIso: "NG",
  phoneDial: "+234",
  phoneNational: "8012345678",
  gender: "female",
  dateOfBirth: "1990-01-02",
  referral: "ABC",
  idNumber: "",
  bvn: "",
};

describe("signup draft", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("round-trips and clears", () => {
    expect(loadSignupDraft()).toBeNull();
    saveSignupDraft(draft);
    expect(loadSignupDraft()).toEqual(draft);
    clearSignupDraft();
    expect(loadSignupDraft()).toBeNull();
  });

  it("never persists a password", () => {
    saveSignupDraft({ ...draft, password: "secret" } as SignupDraft);
    expect(window.sessionStorage.getItem(SIGNUP_DRAFT_KEY)).not.toContain(
      "secret",
    );
  });

  it("tolerates corrupt storage", () => {
    window.sessionStorage.setItem(SIGNUP_DRAFT_KEY, "{nope");
    expect(loadSignupDraft()).toBeNull();
  });

  it("builds hrefs that keep ref", () => {
    expect(signupHref("/signup/verify")).toBe("/signup/verify");
    expect(signupHref("/signup", { ref: "A B" })).toBe("/signup?ref=A+B");
  });
});

describe("signup draft phone proof", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("keeps a draft without a proof exactly as before (no extra keys)", () => {
    saveSignupDraft(draft);
    expect(loadSignupDraft()).toEqual(draft);
    expect(Object.keys(loadSignupDraft() as object)).not.toContain("phoneProof");
  });

  it("round-trips a proof and the number it was issued for", () => {
    saveSignupDraft({ ...draft, phoneProof: "p.sig", phoneProofFor: "+2348012345678" });
    expect(loadSignupDraft()).toMatchObject({ phoneProof: "p.sig", phoneProofFor: "+2348012345678" });
  });

  it("ignores a non-string proof from tampered storage", () => {
    window.sessionStorage.setItem(
      SIGNUP_DRAFT_KEY,
      JSON.stringify({ ...draft, phoneProof: { x: 1 }, phoneProofFor: 5 }),
    );
    const loaded = loadSignupDraft() as unknown as Record<string, unknown>;
    expect(loaded.phoneProof).toBeUndefined();
    expect(loaded.phoneProofFor).toBeUndefined();
  });

  it("carries the proof across a re-save only while the number is unchanged", () => {
    const verified = { ...draft, phoneProof: "p.sig", phoneProofFor: "+2348012345678" };
    expect(carriedPhoneProof(verified, "+2348012345678")).toEqual({
      phoneProof: "p.sig",
      phoneProofFor: "+2348012345678",
    });
    // Edited number: the old proof must be dropped.
    expect(carriedPhoneProof(verified, "+2348099999999")).toEqual({ phoneProof: "", phoneProofFor: "" });
    expect(carriedPhoneProof(null, "+2348012345678")).toEqual({ phoneProof: "", phoneProofFor: "" });
    expect(carriedPhoneProof(draft, "+2348012345678")).toEqual({ phoneProof: "", phoneProofFor: "" });
  });
});
