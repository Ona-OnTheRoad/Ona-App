import "server-only";
import { isProductionRuntime } from "@/lib/server/payments/providers";

/**
 * Ask the bank (Flutterwave account resolve) who holds an account.
 *
 * The holder name stored against a payout / refund account must come from
 * here, never from a request body.
 *
 * resolved    — the bank returned a holder name
 * not_found   — the bank was asked and refused the bank code + number
 * unavailable — the bank could not be asked (no key, network, 5xx, auth, throttled)
 */
export type ResolveAccountResult =
  | {
      status: "resolved";
      accountName: string;
      accountNumber: string;
      bankCode: string;
      source: "flutterwave" | "dev_stand_in";
    }
  | { status: "not_found"; message: string }
  | { status: "unavailable"; code: "no_keys" | "provider_error"; message: string };

const RESOLVE_URL = "https://api.flutterwave.com/v3/accounts/resolve";
const TIMEOUT_MS = 8_000;
const NOT_FOUND_MESSAGE = "Could not verify account. Check bank and account number.";

export async function resolveBankAccount(input: {
  accountNumber: string;
  bankCode: string;
  /**
   * Development only. With no Flutterwave key on a non-production runtime
   * this name is accepted so local and mock flows keep working. Ignored
   * whenever a key is set or the runtime is production / preview.
   */
  devStandInName?: string | null;
}): Promise<ResolveAccountResult> {
  const accountNumber = String(input.accountNumber || "").replace(/\D/g, "");
  const bankCode = String(input.bankCode || "").trim();
  if (accountNumber.length !== 10 || !bankCode) {
    return { status: "not_found", message: NOT_FOUND_MESSAGE };
  }

  const secret = (process.env.FLUTTERWAVE_SECRET_KEY || "").trim();
  if (!secret) {
    const standIn = String(input.devStandInName || "").trim();
    if (standIn && !isProductionRuntime()) {
      return {
        status: "resolved",
        accountName: standIn.slice(0, 120),
        accountNumber,
        bankCode,
        source: "dev_stand_in",
      };
    }
    return {
      status: "unavailable",
      code: "no_keys",
      message: "Name lookup is unavailable (payment keys not configured).",
    };
  }

  const unavailable: ResolveAccountResult = {
    status: "unavailable",
    code: "provider_error",
    message: "Account name lookup is not available right now. Please try again.",
  };

  let res: Response;
  try {
    res = await fetch(RESOLVE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account_number: accountNumber, account_bank: bankCode }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return unavailable;
  }

  // Auth, throttling and server errors: the bank was never really asked.
  if (res.status >= 500 || [401, 403, 408, 429].includes(res.status)) {
    return unavailable;
  }

  const json = (await res.json().catch(() => null)) as {
    status?: string;
    message?: string;
    data?: { account_number?: string; account_name?: string };
  } | null;
  if (!json) return unavailable;

  const accountName = String(json.data?.account_name || "").trim();
  if (!res.ok || json.status !== "success" || !accountName) {
    return { status: "not_found", message: json.message || NOT_FOUND_MESSAGE };
  }
  return {
    status: "resolved",
    accountName: accountName.slice(0, 120),
    accountNumber,
    bankCode,
    source: "flutterwave",
  };
}

/** What a write path may store for a bank account's holder name. */
export type BankNameForSave =
  | { ok: true; accountName: string | null; resolvedAt: string | null }
  | { ok: false; status: 422 | 503; code: string; message: string };

/**
 * Decide the holder name to store for a bank code + number. `typedName` is
 * the client's value: it is never stored, it only feeds the development
 * stand-in. An account the bank does not know is always refused.
 *
 *  - save_unresolved: bank unreachable -> store no name (signup, first-time setup).
 *  - reject:          bank unreachable -> refuse (changing an account on file).
 */
export async function bankNameForSave(input: {
  accountNumber: string;
  bankCode: string;
  typedName?: string | null;
  onUnavailable: "save_unresolved" | "reject";
}): Promise<BankNameForSave> {
  const result = await resolveBankAccount({
    accountNumber: input.accountNumber,
    bankCode: input.bankCode,
    devStandInName: input.typedName,
  });
  if (result.status === "resolved") {
    return {
      ok: true,
      accountName: result.accountName,
      resolvedAt: new Date().toISOString(),
    };
  }
  if (result.status === "not_found") {
    return {
      ok: false,
      status: 422,
      code: "bank_account_not_found",
      message:
        "We could not find that bank account. Check the bank and the account number.",
    };
  }
  if (input.onUnavailable === "save_unresolved") {
    return { ok: true, accountName: null, resolvedAt: null };
  }
  return {
    ok: false,
    status: 503,
    code: "bank_lookup_unavailable",
    message:
      "We could not confirm this account with the bank right now. Your bank details were not changed. Please try again.",
  };
}
