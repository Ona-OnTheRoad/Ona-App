// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const net = vi.hoisted(() => ({ authFetch: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("@/lib/api-auth-headers", () => ({ authFetch: (...a: unknown[]) => net.authFetch(...a) }));
vi.mock("@/lib/toast", () => ({
  toastError: (m: string) => net.toastError(m),
  toastSuccess: (m: string) => net.toastSuccess(m),
}));

import { BankChangeFlow } from "../bank-change-flow";

const json = (body: unknown) => ({ json: async () => body });
const ok = (data: unknown = {}) => json({ ok: true, data });
const fail = (message: string, code: string) => json({ ok: false, error: { message, code } });
const routes: Record<string, () => unknown> = {};
const calls = (url: string) =>
  net.authFetch.mock.calls.filter((c) => c[0] === url).map((c) => JSON.parse((c[1] as { body: string }).body));

const onChanged = vi.fn();
const renderFlow = () =>
  render(
    <BankChangeFlow
      isLight
      currentBank={{ bankName: "GTBank", bankAccountName: "Ada User", bankAccountNumber: "0123456789", bankCode: "058" }}
      accessToken="tok-1234567890"
      onBankChanged={onChanged}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(routes)) delete routes[k];
  routes["/api/security/change-bank/send-code"] = () => ok({ sent: true, resendInSec: 30, phone: "+2348***678" });
  routes["/api/security/change-bank/verify-code"] = () => ok({ verified: true, bankProof: "BANK-PROOF-1" });
  routes["/api/security/action"] = () => ok({ updated: true });
  net.authFetch.mockImplementation(async (url: string) => routes[url]());
});
afterEach(() => cleanup());

const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
const field = (p: string) => screen.getByPlaceholderText(p) as HTMLInputElement;
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

async function verifyIt() {
  click("Change");
  click("Send security code");
  await waitFor(() => field("000000"));
  type(field("000000"), "123456");
  click("Verify code");
  await waitFor(() => field("Bank name"));
}
function fillNewBank() {
  type(field("Bank name"), "Access Bank");
  type(field("Account name"), "Ada User");
  type(field("Account number (10 digits)"), "9876543210");
  type(field("Bank code / sort code"), "044");
}

describe("BankChangeFlow (Settings, Repair Pro payout)", () => {
  it("sends the code via the server (no client-chosen phone), then changes the bank with the proof", async () => {
    renderFlow();
    await verifyIt();
    // The browser sends no phone number: the server reads it from the account.
    expect(calls("/api/security/change-bank/send-code")[0]).toEqual({});
    expect(calls("/api/security/change-bank/verify-code")[0]).toEqual({ code: "123456" });

    fillNewBank();
    click("Update bank account");
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith({
      bankName: "Access Bank", bankAccountName: "Ada User", bankAccountNumber: "9876543210", bankCode: "044",
    }));
    const body = calls("/api/security/action")[0];
    expect(body).toMatchObject({ action: "change_bank", accessToken: "tok-1234567890", bankProof: "BANK-PROOF-1" });
    expect(JSON.parse(body.newValue)).toEqual({
      bankName: "Access Bank", bankAccountName: "Ada User", bankAccountNumber: "9876543210", bankCode: "044",
    });
  });

  it("a wrong code keeps the user on the code step with a cleared box and a Resend option", async () => {
    routes["/api/security/change-bank/verify-code"] = () => fail("Incorrect code. Try again.", "otp_invalid");
    renderFlow();
    click("Change");
    click("Send security code");
    await waitFor(() => field("000000"));
    type(field("000000"), "111111");
    click("Verify code");
    await waitFor(() => expect(net.toastError).toHaveBeenCalledWith("Incorrect code. Try again."));
    expect(field("000000").value).toBe("");
    expect(screen.queryByPlaceholderText("Bank name")).toBeNull();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeTruthy();
  });

  it("Resend asks the server for a new code", async () => {
    renderFlow();
    click("Change");
    click("Send security code");
    await waitFor(() => field("000000"));
    click("Resend code");
    await waitFor(() => expect(calls("/api/security/change-bank/send-code")).toHaveLength(2));
  });

  it("an account already used elsewhere keeps the user on the form with what they typed", async () => {
    routes["/api/security/action"] = () => fail("This bank account is already used on another Ona account.", "bank_account_in_use");
    renderFlow();
    await verifyIt();
    fillNewBank();
    click("Update bank account");
    await waitFor(() => expect(net.toastError).toHaveBeenCalledWith(expect.stringMatching(/already used/i)));
    expect(field("Account number (10 digits)").value).toBe("9876543210");
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("an expired proof sends the user back to request a new code", async () => {
    routes["/api/security/action"] = () => fail("Please verify with the code sent to your phone.", "verification_required");
    renderFlow();
    await verifyIt();
    fillNewBank();
    click("Update bank account");
    await waitFor(() => expect(screen.getByRole("button", { name: "Send security code" })).toBeTruthy());
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("a network failure keeps the user on the form instead of a dead end", async () => {
    routes["/api/security/action"] = () => { throw new Error("offline"); };
    renderFlow();
    await verifyIt();
    fillNewBank();
    click("Update bank account");
    await waitFor(() => expect(net.toastError).toHaveBeenCalledWith("Network error. Try again."));
    expect(field("Bank code / sort code").value).toBe("044");
  });

  it("client-side validation still blocks a short account number before any request", async () => {
    renderFlow();
    await verifyIt();
    type(field("Bank name"), "Access Bank");
    type(field("Account name"), "Ada User");
    type(field("Account number (10 digits)"), "12345");
    type(field("Bank code / sort code"), "044");
    click("Update bank account");
    await waitFor(() => expect(net.toastError).toHaveBeenCalledWith("Account number must be 10 digits"));
    expect(calls("/api/security/action")).toHaveLength(0);
  });
});
