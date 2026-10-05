/**
 * Nigeria bank details for escrow refunds (customer) and payouts (pro).
 * Flutterwave: bank code = account_bank on transfers / bank refunds.
 */

import type { UserProfile } from "@/lib/types";
import {
  NG_BANKS,
  bankNameForCode,
  type BankOption,
} from "./bank-details/banks";
import { bankAccountMatchesSignupName } from "./bank-details/name-match";

export {
  NG_BANKS,
  bankCodeForName,
  bankNameForCode,
} from "./bank-details/banks";
export type { BankOption } from "./bank-details/banks";
export {
  bankAccountMatchesSignupName,
  nameTokens,
} from "./bank-details/name-match";
export {
  checkBankAccountAvailable,
  fetchCountryBanks,
  fetchNigeriaBanks,
  resolveNigeriaAccountName,
} from "./bank-details/network";

export function hasCompleteBankDetails(
  profile: UserProfile | null | undefined,
): boolean {
  if (!profile) return false;
  const name = (profile.bankAccountName || "").trim();
  const num = (profile.bankAccountNumber || "").replace(/\D/g, "");
  const code = (profile.bankCode || "").trim();
  const bank = (profile.bankName || "").trim() || bankNameForCode(code);
  return Boolean(bank && name && num.length === 10 && code);
}

/**
 * Any signed-in user with incomplete bank lower panel (not full-app block).
 * Code is auto-filled when they select a bank from Flutterwave list.
 */
export function requiresBankSetup(
  profile: UserProfile | null | undefined,
): boolean {
  if (!profile) return false;
  return !hasCompleteBankDetails(profile);
}

export function validateBankDetailsInput(
  input: {
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankCode?: string;
  },
  list: BankOption[] = NG_BANKS,
  /** Signup full name bank account name must match ≥2 parts */
  signupFullName?: string | null,
): string | null {
  const code = (input.bankCode || "").trim();
  const bank = (input.bankName || "").trim() || bankNameForCode(code, list);
  const name = (input.bankAccountName || "").trim();
  const num = (input.bankAccountNumber || "").replace(/\D/g, "");
  if (!code) return "Pick your bank. The bank code fills itself.";
  if (!bank) return "Bank name is required.";
  if (!name) return "Account name is required.";
  if (num.length !== 10) return "Account number must be 10 digits.";
  if (signupFullName != null && String(signupFullName).trim()) {
    const match = bankAccountMatchesSignupName(name, signupFullName);
    if (!match.ok) return match.error;
  }
  return null;
}
