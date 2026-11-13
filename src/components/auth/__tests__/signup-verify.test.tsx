// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ replace: vi.fn(), go: vi.fn() }));
const api = vi.hoisted(() => ({ send: vi.fn(), verify: vi.fn() }));
const toasts = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/auth/auth-transition", () => ({
  useAuthNavigate: () => ({ exiting: false, go: nav.go }),
}));
vi.mock("@/lib/auth/signup-otp-client", () => ({
  sendSignupPhoneCode: (...a: unknown[]) => api.send(...a),
  verifySignupPhoneCode: (...a: unknown[]) => api.verify(...a),
}));
vi.mock("@/lib/toast", () => ({
  toastError: (m: string) => toasts.error(m),
  toastSuccess: (m: string) => toasts.success(m),
  toastInfo: (m: string) => toasts.info(m),
}));

import { SignupVerify } from "../signup-verify";
import { loadSignupDraft, saveSignupDraft, SIGNUP_DRAFT_KEY, type SignupDraft } from "@/lib/signup-draft";

const PHONE = "+2348031234567";
const draft: SignupDraft = {
  firstName: "Ada", lastName: "Okafor", email: "ada@example.com",
  phoneIso: "NG", phoneDial: "+234", phoneNational: "8031234567",
  gender: "female", dateOfBirth: "1990-01-02", referral: "", idNumber: "", bvn: "",
};

const sentOk = { ok: true, phone: PHONE, resendInSec: 30 };
const boxes = () => screen.getAllByRole("textbox") as HTMLInputElement[];
const typeCode = (code: string) => fireEvent.change(boxes()[0], { target: { value: code } });

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
  api.send.mockResolvedValue(sentOk);
  api.verify.mockResolvedValue({ ok: false, error: "Incorrect code.", code: "otp_invalid" });
  saveSignupDraft(draft);
});
afterEach(() => cleanup());

describe("SignupVerify", () => {
  it("texts a code once (even in React Strict Mode) and shows live boxes with a resend timer", async () => {
    render(<StrictMode><SignupVerify /></StrictMode>);
    await waitFor(() => expect(boxes()).toHaveLength(6));
    await waitFor(() => expect(boxes()[0].disabled).toBe(false));
    expect(api.send).toHaveBeenCalledTimes(1);
    expect(api.send).toHaveBeenCalledWith(PHONE);
    expect(screen.getByText(/4567/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /resend code \(\d+s\)/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeTruthy();
  });

  it("does not text again when the user comes back within the code's lifetime", async () => {
    sessionStorage.setItem(`ona-signup-otp-sent:${PHONE}`, String(Date.now() - 60_000));
    render(<SignupVerify />);
    await waitFor(() => expect(boxes()[0].disabled).toBe(false));
    expect(api.send).not.toHaveBeenCalled();
    // 60s later the resend gap has passed, so Resend is available.
    expect((screen.getByRole("button", { name: "Resend code" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("texts again if the earlier code has expired", async () => {
    sessionStorage.setItem(`ona-signup-otp-sent:${PHONE}`, String(Date.now() - 11 * 60_000));
    render(<SignupVerify />);
    await waitFor(() => expect(api.send).toHaveBeenCalledTimes(1));
  });

  it("verifies on the sixth digit, stores the proof in the draft and offers Continue", async () => {
    api.verify.mockResolvedValue({ ok: true, phone: PHONE, proof: "payload.signature" });
    render(<SignupVerify />);
    await waitFor(() => expect(boxes()[0].disabled).toBe(false));
    typeCode("482913");
    await waitFor(() => expect(api.verify).toHaveBeenCalledWith(PHONE, "482913"));
    await screen.findByText(/your phone is verified/i);
    expect(loadSignupDraft()).toMatchObject({ phoneProof: "payload.signature", phoneProofFor: PHONE });
    expect(toasts.success).toHaveBeenCalled();
    // Verified: Continue replaces Skip, and goes on to role selection.
    expect(screen.queryByRole("button", { name: "Skip for now" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(nav.go).toHaveBeenCalledWith("/login/role");
  });

  it("never verifies on fewer than six digits", async () => {
    render(<SignupVerify />);
    await waitFor(() => expect(boxes()[0].disabled).toBe(false));
    typeCode("4829");
    await act(async () => { await new Promise((r) => setTimeout(r, 80)); });
    expect(api.verify).not.toHaveBeenCalled();
  });

  it("shows the error, clears the boxes and stores nothing for a wrong code", async () => {
    render(<SignupVerify />);
    await waitFor(() => expect(boxes()[0].disabled).toBe(false));
    typeCode("000000");
    await waitFor(() => expect(toasts.error).toHaveBeenCalledWith("Incorrect code."));
    await waitFor(() => expect(boxes().every((b) => b.value === "")).toBe(true));
    expect(loadSignupDraft()?.phoneProof).toBeUndefined();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeTruthy();
    // And the user can try again.
    api.verify.mockResolvedValue({ ok: true, phone: PHONE, proof: "p.s" });
    await waitFor(() => expect(boxes()[0].disabled).toBe(false));
    typeCode("482913");
    await screen.findByText(/your phone is verified/i);
  });

  it("blocks with a log-in option when the number already has an account, and removes Skip", async () => {
    api.send.mockResolvedValue({ ok: false, error: "exists", code: "phone_in_use" });
    render(<SignupVerify />);
    await screen.findByText(/already has an ona account/i);
    expect(screen.queryByRole("button", { name: "Skip for now" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(nav.go).toHaveBeenCalledWith("/login/signin");
    fireEvent.click(screen.getByRole("button", { name: "Use a different number" }));
    expect(nav.go).toHaveBeenCalledWith("/signup");
  });

  it("offers Try again when the first send fails, keeps Skip available, and can recover", async () => {
    api.send.mockResolvedValueOnce({ ok: false, error: "We couldn't send the SMS right now.", code: "sms_failed" });
    render(<SignupVerify />);
    await screen.findByRole("button", { name: "Try again" });
    expect(toasts.error).toHaveBeenCalledWith("We couldn't send the SMS right now.");
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeTruthy();
    api.send.mockResolvedValue(sentOk);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(boxes()).toHaveLength(6));
    expect(api.send).toHaveBeenCalledTimes(2);
  });

  it("keeps the boxes and shows the timer when the server says a code was just sent", async () => {
    api.send.mockResolvedValue({ ok: false, error: "Please wait 12s", code: "resend_wait", retryAfterSec: 12 });
    render(<SignupVerify />);
    await waitFor(() => expect(boxes()).toHaveLength(6));
    await waitFor(() => expect(screen.getByRole("button", { name: /resend code \(1\ds\)/i })).toBeTruthy());
    expect(toasts.info).toHaveBeenCalledWith("Please wait 12s");
  });

  it("skips straight to role selection without verifying anything", async () => {
    render(<SignupVerify />);
    await waitFor(() => expect(boxes()[0].disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(nav.go).toHaveBeenCalledWith("/login/role");
    expect(api.verify).not.toHaveBeenCalled();
    expect(loadSignupDraft()?.phoneProof).toBeUndefined();
  });

  it("when verification is unavailable it says so, shows no dead boxes, and Skip still works", async () => {
    api.send.mockResolvedValue({ ok: false, error: "unavailable", code: "sms_unavailable" });
    render(<SignupVerify />);
    await screen.findByText(/isn.t available right now/i);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(toasts.error).not.toHaveBeenCalled(); // not an error the user caused
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(nav.go).toHaveBeenCalledWith("/login/role");
  });

  it("skips even when the code could not be sent at all", async () => {
    api.send.mockResolvedValue({ ok: false, error: "down", code: "sms_failed" });
    render(<SignupVerify />);
    await screen.findByRole("button", { name: "Try again" });
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(nav.go).toHaveBeenCalledWith("/login/role");
  });

  it("shows an already-verified number as done without texting again", async () => {
    saveSignupDraft({ ...draft, phoneProof: "p.s", phoneProofFor: PHONE });
    render(<SignupVerify />);
    await screen.findByText(/your phone is verified/i);
    expect(api.send).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });

  it("re-verifies when the proof belongs to a different number", async () => {
    saveSignupDraft({ ...draft, phoneProof: "p.s", phoneProofFor: "+2348099999999" });
    render(<SignupVerify />);
    await waitFor(() => expect(api.send).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/your phone is verified/i)).toBeNull();
  });

  it("sends the user back to the details step when there is no draft", async () => {
    sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
    render(<SignupVerify />);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/signup"));
    expect(api.send).not.toHaveBeenCalled();
  });

  it("resend asks the server again and restarts the timer", async () => {
    sessionStorage.setItem(`ona-signup-otp-sent:${PHONE}`, String(Date.now() - 60_000));
    render(<SignupVerify />);
    await waitFor(() => expect(boxes()[0].disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() => expect(api.send).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("button", { name: /resend code \(\d+s\)/i })).toBeTruthy());
  });
});
