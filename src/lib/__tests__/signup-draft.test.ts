// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
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
