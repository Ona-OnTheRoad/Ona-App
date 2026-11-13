// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  authFetch: vi.fn(),
  update: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  profile: null as Record<string, unknown> | null,
  /** What the (mocked) bank fields hook reports as the form values. */
  fields: { bankCode: "", bankAccountName: "", bankAccountNumber: "" },
  available: { ok: true } as { ok: boolean; error?: string },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));
vi.mock("@/lib/navigation", () => ({ navigateBack: vi.fn() }));
vi.mock("@/lib/store", () => ({
  useApp: () => ({ theme: "light", userProfile: h.profile, updateUserProfile: h.update, accountType: "professional" }),
}));
vi.mock("@/lib/api-auth-headers", () => ({ authFetch: (...a: unknown[]) => h.authFetch(...a) }));
vi.mock("@/lib/supabase/session", () => ({
  ensureAppSession: async () => ({ accessToken: "access-token-1234567890" }),
}));
vi.mock("@/lib/toast", () => ({
  toastError: (m: string) => h.toastError(m),
  toastSuccess: (m: string) => h.toastSuccess(m),
}));
vi.mock("@/lib/bank-details", async (orig) => ({
  ...(await orig<typeof import("@/lib/bank-details")>()),
  checkBankAccountAvailable: async () => h.available,
}));
// The real hook loads banks and resolves account names over the network; the screen only needs its values.
vi.mock("@/components/auth/bank-details-fields/use-bank-details-fields", () => ({
  useBankDetailsFields: () => ({
    banks: [], loadingBanks: false, resolving: false, resolveMsg: null, selectVal: "",
    bankCode: h.fields.bankCode,
    bankAccountName: h.fields.bankAccountName,
    bankAccountNumber: h.fields.bankAccountNumber,
    onSelectBank: vi.fn(), onAccountNumberChange: vi.fn(), onAccountNameChange: vi.fn(),
  }),
}));
vi.mock("../bank-select-dropdown", () => ({ BankSelectDropdown: () => <div data-testid="bank-select" /> }));
vi.mock("../bank-account-fields", () => ({ BankAccountFields: () => <div data-testid="bank-fields" /> }));

import { BankAccountScreen } from "../bank-account-screen";

const json = (body: unknown) => ({ json: async () => body });
const ok = (data: unknown = {}) => json({ ok: true, data });
const fail = (message: string, code: string) => json({ ok: false, error: { message, code } });
const routes: Record<string, () => unknown> = {};
const calls = (url: string) =>
  h.authFetch.mock.calls.filter((c) => c[0] === url).map((c) => JSON.parse((c[1] as { body: string }).body));

const SAVED = { bankCode: "058", bankName: "GTBank", bankAccountName: "Ada User", bankAccountNumber: "0123456789" };
const NEW = { bankCode: "044", bankName: "Access Bank", bankAccountName: "Ada User", bankAccountNumber: "9876543210" };

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(routes)) delete routes[k];
  routes["/api/security/change-bank/send-code"] = () => ok({ sent: true, resendInSec: 30, phone: "+2348***678" });
  routes["/api/security/change-bank/verify-code"] = () => ok({ verified: true, bankProof: "BANK-PROOF-1" });
  routes["/api/security/action"] = () => ok({ updated: true });
  h.authFetch.mockImplementation(async (url: string) => routes[url]());
  h.update.mockReturnValue(null);
  h.available = { ok: true };
  h.profile = { fullName: "Ada User", identityCountryIso: "NG", ...SAVED };
  h.fields = { bankCode: SAVED.bankCode, bankAccountName: SAVED.bankAccountName, bankAccountNumber: SAVED.bankAccountNumber };
});
afterEach(() => cleanup());

const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
const code = () => screen.getByPlaceholderText("000000") as HTMLInputElement;

async function verifyIt() {
  click("Edit");
  click("Send security code");
  await waitFor(() => expect(code()).toBeTruthy());
  fireEvent.change(code(), { target: { value: "123456" } });
  click("Verify code");
  await waitFor(() => expect(screen.getByRole("button", { name: "Save bank" })).toBeTruthy());
}

describe("BankAccountScreen with a bank already saved", () => {
  it("Edit shows the verification step first: no fields, and nothing is sent until the user asks", async () => {
    render(<BankAccountScreen />);
    click("Edit");
    expect(screen.getByText("Verify it's you")).toBeTruthy();
    expect(screen.queryByTestId("bank-fields")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save bank" })).toBeNull();
    expect(h.authFetch).not.toHaveBeenCalled();
  });

  it("verify -> edit -> save changes the bank through the verified path, sending the proof", async () => {
    // The user types a new account into the form (the mocked fields hook reports these values).
    h.fields = { bankCode: NEW.bankCode, bankAccountName: NEW.bankAccountName, bankAccountNumber: NEW.bankAccountNumber };
    render(<BankAccountScreen />);
    await verifyIt();
    expect(calls("/api/security/change-bank/send-code")).toHaveLength(1);
    expect(calls("/api/security/change-bank/verify-code")[0]).toEqual({ code: "123456" });
    expect(screen.getByTestId("bank-fields")).toBeTruthy();

    click("Save bank");
    await waitFor(() => expect(calls("/api/security/action")).toHaveLength(1));
    const body = calls("/api/security/action")[0];
    expect(body).toMatchObject({ action: "change_bank", accessToken: "access-token-1234567890", bankProof: "BANK-PROOF-1" });
    expect(JSON.parse(body.newValue)).toMatchObject({ bankAccountNumber: "9876543210", bankCode: "044" });
    await waitFor(() => expect(h.update).toHaveBeenCalledWith(expect.objectContaining({ bankAccountNumber: "9876543210", bankCode: "044" })));
    await waitFor(() => expect(h.toastSuccess).toHaveBeenCalledWith("Bank saved successfully."));
    // The change went through the secure endpoint BEFORE the local/profile save.
    expect(h.authFetch.mock.invocationCallOrder[h.authFetch.mock.calls.length - 1]).toBeLessThan(h.update.mock.invocationCallOrder[0]);
  });

  it("a wrong code keeps the user on the verification step", async () => {
    routes["/api/security/change-bank/verify-code"] = () => fail("Incorrect code. Try again.", "otp_invalid");
    render(<BankAccountScreen />);
    click("Edit");
    click("Send security code");
    await waitFor(() => expect(code()).toBeTruthy());
    fireEvent.change(code(), { target: { value: "111111" } });
    click("Verify code");
    await waitFor(() => expect(h.toastError).toHaveBeenCalledWith("Incorrect code. Try again."));
    expect(screen.queryByTestId("bank-fields")).toBeNull();
    expect(code().value).toBe("");
    expect(screen.getByRole("button", { name: "Resend code" })).toBeTruthy();
  });

  it("Resend asks the server for a new code", async () => {
    render(<BankAccountScreen />);
    click("Edit");
    click("Send security code");
    await waitFor(() => expect(code()).toBeTruthy());
    click("Resend code");
    await waitFor(() => expect(calls("/api/security/change-bank/send-code")).toHaveLength(2));
  });

  it("an expired proof at save time sends the user back to verify again, without saving anything", async () => {
    routes["/api/security/action"] = () => fail("Please verify with the code sent to your phone.", "verification_required");
    render(<BankAccountScreen />);
    await verifyIt();
    click("Save bank");
    await waitFor(() => expect(screen.getByText("Verify it's you")).toBeTruthy());
    expect(h.update).not.toHaveBeenCalled();
  });

  it("an account another user already has shows the message, stays on the form, and saves nothing", async () => {
    routes["/api/security/action"] = () => fail("This bank account is already used on another Ona account.", "bank_account_in_use");
    render(<BankAccountScreen />);
    await verifyIt();
    click("Save bank");
    await waitFor(() => expect(h.toastError).toHaveBeenCalledWith(expect.stringMatching(/already used/i)));
    expect(screen.getByRole("button", { name: "Save bank" })).toBeTruthy();
    expect(h.update).not.toHaveBeenCalled();
  });

  it("Cancel on the verification step returns to the saved account", async () => {
    render(<BankAccountScreen />);
    click("Edit");
    click("Cancel");
    await waitFor(() => expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy());
    expect(screen.queryByText("Verify it's you")).toBeNull();
  });

  it("the availability check still runs before anything is sent", async () => {
    h.available = { ok: false, error: "This bank is already used on another Ona account." };
    render(<BankAccountScreen />);
    await verifyIt();
    click("Save bank");
    await waitFor(() => expect(h.toastError).toHaveBeenCalledWith(expect.stringMatching(/already used/i)));
    expect(calls("/api/security/action")).toHaveLength(0);
  });
});

describe("BankAccountScreen with no bank saved yet", () => {
  beforeEach(() => {
    h.profile = { fullName: "Ada User", identityCountryIso: "NG" };
    h.fields = { bankCode: NEW.bankCode, bankAccountName: NEW.bankAccountName, bankAccountNumber: NEW.bankAccountNumber };
  });

  it("needs no verification: saves straight through the normal profile save", async () => {
    render(<BankAccountScreen />);
    expect(screen.queryByText("Verify it's you")).toBeNull();
    expect(screen.getByRole("button", { name: "Save bank" })).toBeTruthy();
    click("Save bank");
    await waitFor(() => expect(h.update).toHaveBeenCalledWith(expect.objectContaining({ bankAccountNumber: "9876543210" })));
    expect(h.authFetch).not.toHaveBeenCalled();
  });
});
