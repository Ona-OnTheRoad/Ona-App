// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const net = vi.hoisted(() => ({
  authFetch: vi.fn(),
  sendOtp: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/api-auth-headers", () => ({ authFetch: (...a: unknown[]) => net.authFetch(...a) }));
vi.mock("@/lib/supabase/app-api", () => ({ backendSendOtp: (...a: unknown[]) => net.sendOtp(...a) }));
vi.mock("@/lib/toast", () => ({
  toastError: (m: string) => net.toastError(m),
  toastSuccess: (m: string) => net.toastSuccess(m),
}));

import { PhoneChangeFlow } from "../phone-change-flow";
import { EmailChangeFlow } from "../email-change-flow";

const json = (body: unknown) => ({ json: async () => body });
const ok = (data: unknown = {}) => json({ ok: true, data });
const fail = (message: string, code: string) => json({ ok: false, error: { message, code } });

/** authFetch answers by URL; each can be overridden per test. */
const routes: Record<string, () => unknown> = {};
const calls = (url: string) =>
  net.authFetch.mock.calls.filter((c) => c[0] === url).map((c) => JSON.parse((c[1] as { body: string }).body));

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(routes)) delete routes[k];
  routes["/api/security/verify-identity"] = () => ok({ verified: true, identityProof: "PROOF-1" });
  routes["/api/security/change-contact/send-code"] = () => ok({ sent: true, resendInSec: 30 });
  routes["/api/security/action"] = () => ok({ updated: true });
  net.authFetch.mockImplementation(async (url: string) => routes[url]());
  net.sendOtp.mockResolvedValue({ error: null });
});
afterEach(() => cleanup());

const placeholder = (p: string) => screen.getByPlaceholderText(p) as HTMLInputElement;
const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

async function passIdentity() {
  click("Change");
  click("Send code to email");
  await waitFor(() => expect(placeholder("000000")).toBeTruthy());
  type(placeholder("Enter your password"), "Strong#Pass1");
  type(placeholder("000000"), "123456");
  click("Verify identity");
}

describe("PhoneChangeFlow", () => {
  const onChanged = vi.fn();
  const renderFlow = (guarantorName?: string) =>
    render(
      <PhoneChangeFlow isLight currentPhone="+2348012345678" currentEmail="ada@ona.test"
        isPhoneVerified guarantorName={guarantorName} accessToken="tok" onPhoneChanged={onChanged} />,
    );

  it("a customer with no guarantor: identity -> code to the new number -> changed, sending the proof and code", async () => {
    renderFlow();
    await passIdentity();
    // No guarantor field is shown or sent when none is on file.
    expect(screen.queryByPlaceholderText("Enter your guarantor's full name")).toBeNull();
    await waitFor(() => expect(placeholder("+234 801 234 5678")).toBeTruthy());
    expect(calls("/api/security/verify-identity")[0]).toEqual({ accessToken: "tok", password: "Strong#Pass1", emailCode: "123456" });

    type(placeholder("+234 801 234 5678"), "0807 777 7777");
    click("Send code to new number");
    await waitFor(() => expect(placeholder("000000")).toBeTruthy());
    expect(calls("/api/security/change-contact/send-code")[0]).toEqual({
      channel: "phone", target: "0807 777 7777", identityProof: "PROOF-1",
    });
    // The login-code route (which refuses new numbers) is no longer used for the NEW contact.
    expect(net.sendOtp).toHaveBeenCalledTimes(1);
    expect(net.sendOtp).toHaveBeenCalledWith({ channel: "email", target: "ada@ona.test" });

    type(placeholder("000000"), "654321");
    click("Verify code");
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith("0807 777 7777"));
    expect(calls("/api/security/action")[0]).toEqual({
      action: "change_phone", accessToken: "tok", newValue: "0807 777 7777", code: "654321", identityProof: "PROOF-1",
    });
  });

  it("a wrong code keeps the user on the code step to try again (no dead end)", async () => {
    routes["/api/security/action"] = () => fail("Incorrect code. Try again.", "otp_invalid");
    renderFlow();
    await passIdentity();
    await waitFor(() => placeholder("+234 801 234 5678"));
    type(placeholder("+234 801 234 5678"), "08077777777");
    click("Send code to new number");
    await waitFor(() => placeholder("000000"));
    type(placeholder("000000"), "111111");
    click("Verify code");
    await waitFor(() => expect(net.toastError).toHaveBeenCalledWith("Incorrect code. Try again."));
    // Still on the code step, with a cleared box and a Resend option.
    expect(placeholder("000000").value).toBe("");
    expect(screen.getByRole("button", { name: "Resend code" })).toBeTruthy();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("Resend asks the server for a new code", async () => {
    renderFlow();
    await passIdentity();
    await waitFor(() => placeholder("+234 801 234 5678"));
    type(placeholder("+234 801 234 5678"), "08077777777");
    click("Send code to new number");
    await waitFor(() => placeholder("000000"));
    click("Resend code");
    await waitFor(() => expect(calls("/api/security/change-contact/send-code")).toHaveLength(2));
  });

  it("a number already in use shows the server's message and stays on the number step", async () => {
    routes["/api/security/change-contact/send-code"] = () => fail("This phone number is already used on another Ona account.", "in_use");
    renderFlow();
    await passIdentity();
    await waitFor(() => placeholder("+234 801 234 5678"));
    type(placeholder("+234 801 234 5678"), "08099999999");
    click("Send code to new number");
    await waitFor(() => expect(net.toastError).toHaveBeenCalledWith(expect.stringMatching(/already used/i)));
    expect(placeholder("+234 801 234 5678")).toBeTruthy();
  });

  it("an expired identity proof sends the user back to the identity step", async () => {
    routes["/api/security/change-contact/send-code"] = () => fail("Please verify your identity again.", "identity_required");
    renderFlow();
    await passIdentity();
    await waitFor(() => placeholder("+234 801 234 5678"));
    type(placeholder("+234 801 234 5678"), "08077777777");
    click("Send code to new number");
    await waitFor(() => expect(screen.getByText("Verify your identity")).toBeTruthy());
    expect(placeholder("Enter your password").value).toBe("");
  });

  it("a Repair Pro with a guarantor on file must enter the name and it is sent", async () => {
    renderFlow("Bola Guarantor");
    click("Change");
    click("Send code to email");
    await waitFor(() => placeholder("000000"));
    type(placeholder("Enter your password"), "Strong#Pass1");
    type(placeholder("000000"), "123456");
    type(placeholder("Enter your guarantor's full name"), "Bola Guarantor");
    click("Verify identity");
    await waitFor(() => expect(calls("/api/security/verify-identity")).toHaveLength(1));
    expect(calls("/api/security/verify-identity")[0].guarantorName).toBe("Bola Guarantor");
  });

  it("an identity failure (wrong password) does not advance and issues no proof", async () => {
    routes["/api/security/verify-identity"] = () => fail("Current password is incorrect.", "forbidden");
    renderFlow();
    await passIdentity();
    await waitFor(() => expect(net.toastError).toHaveBeenCalledWith("Current password is incorrect."));
    expect(screen.queryByPlaceholderText("+234 801 234 5678")).toBeNull();
    expect(calls("/api/security/change-contact/send-code")).toHaveLength(0);
  });
});

describe("EmailChangeFlow", () => {
  const onChanged = vi.fn();
  const renderFlow = () =>
    render(
      <EmailChangeFlow isLight currentEmail="ada@ona.test" isEmailVerified accessToken="tok" onEmailChanged={onChanged} />,
    );

  it("identity -> code to the new email -> changed (lower-cased), sending the proof and code", async () => {
    renderFlow();
    await passIdentity();
    await waitFor(() => placeholder("new@example.com"));
    type(placeholder("new@example.com"), "  Ada.New@Ona.TEST ");
    click("Send code to new email");
    await waitFor(() => placeholder("000000"));
    expect(calls("/api/security/change-contact/send-code")[0]).toEqual({
      channel: "email", target: "ada.new@ona.test", identityProof: "PROOF-1",
    });
    type(placeholder("000000"), "654321");
    click("Verify code");
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith("ada.new@ona.test"));
    expect(calls("/api/security/action")[0]).toEqual({
      action: "change_email", accessToken: "tok", newValue: "ada.new@ona.test", code: "654321", identityProof: "PROOF-1",
    });
  });

  it("a network failure while changing keeps the user on the code step instead of a dead end", async () => {
    routes["/api/security/action"] = () => { throw new Error("offline"); };
    renderFlow();
    await passIdentity();
    await waitFor(() => placeholder("new@example.com"));
    type(placeholder("new@example.com"), "ada.new@ona.test");
    click("Send code to new email");
    await waitFor(() => placeholder("000000"));
    type(placeholder("000000"), "654321");
    click("Verify code");
    await waitFor(() => expect(net.toastError).toHaveBeenCalledWith("Network error. Try again."));
    expect(placeholder("000000")).toBeTruthy();
    expect(onChanged).not.toHaveBeenCalled();
  });
});
