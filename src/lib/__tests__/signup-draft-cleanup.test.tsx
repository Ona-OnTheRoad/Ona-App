// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadSignupDraft,
  saveSignupDraft,
  type SignupDraft,
} from "@/lib/signup-draft";

const state = vi.hoisted(() => ({ isAuthenticated: false, pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@/lib/store", () => ({
  useApp: () => ({ isAuthenticated: state.isAuthenticated }),
}));

import { useSignupDraftCleanup } from "@/lib/use-signup-draft-cleanup";

const draft: SignupDraft = {
  firstName: "Ada",
  lastName: "Okafor",
  email: "ada@example.com",
  phoneIso: "NG",
  phoneDial: "234",
  phoneNational: "8031234567",
  gender: "female",
  dateOfBirth: "1995-05-05",
  referral: "",
  idNumber: "",
  bvn: "",
};

describe("useSignupDraftCleanup", () => {
  beforeEach(() => {
    sessionStorage.clear();
    saveSignupDraft(draft);
  });

  it("keeps the draft while signed out", () => {
    state.isAuthenticated = false;
    state.pathname = "/login/signin";
    renderHook(() => useSignupDraftCleanup());
    expect(loadSignupDraft()).not.toBeNull();
  });

  it("drops the draft once signed in outside the signup routes", () => {
    state.isAuthenticated = true;
    state.pathname = "/";
    renderHook(() => useSignupDraftCleanup());
    expect(loadSignupDraft()).toBeNull();
  });

  it("keeps it on /signup routes (dual-role signup needs it)", () => {
    state.isAuthenticated = true;
    state.pathname = "/signup/motorist";
    renderHook(() => useSignupDraftCleanup());
    expect(loadSignupDraft()).not.toBeNull();
  });
});
