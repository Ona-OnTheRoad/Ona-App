import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { apiFail } from "@/lib/server/api-json";
import { bankNameForSave } from "@/lib/server/payments/resolve-account";

/** Columns a profile save may write for the bank account holder name. */
export type BankNameColumns = {
  bank_account_name?: string | null;
  bank_account_resolved_at?: string | null;
};

type BankRow = {
  bank_code?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_account_resolved_at?: string | null;
} | null;

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");
const COLUMNS = "bank_code, bank_account_number, bank_account_name, bank_account_resolved_at";

/**
 * Work out the holder-name columns for a generic profile save. The client's
 * `bankAccountName` is never written.
 *
 *  - Patch without a number or bank code (name only)   -> nothing to write.
 *  - Same account as on file, already bank-confirmed    -> keep that name, no lookup.
 *  - Otherwise the bank is asked. Unknown account -> rejected. Bank unreachable
 *    -> a new account is saved with no name; a legacy row is left as it is.
 *
 * Runs before any write, so a rejection changes nothing.
 */
export async function planBankNameColumns(
  admin: SupabaseClient,
  userId: string,
  isRepairPro: boolean,
  patch: { bankAccountNumber?: string; bankCode?: string; bankAccountName?: string },
): Promise<{ ok: true; columns: BankNameColumns } | { ok: false; response: Response }> {
  if (patch.bankAccountNumber === undefined && patch.bankCode === undefined) {
    return { ok: true, columns: {} };
  }

  const [mot, pro] = await Promise.all([
    admin.from("motorist_profiles").select(COLUMNS).eq("user_id", userId).maybeSingle(),
    admin.from("repair_pro_profiles").select(COLUMNS).eq("user_id", userId).maybeSingle(),
  ]);
  if (mot.error || pro.error) {
    return {
      ok: false,
      response: apiFail("Could not check your bank details. Please try again.", 503, "bank_check_failed"),
    };
  }
  const own = (isRepairPro ? pro.data : mot.data) as BankRow;
  const other = (isRepairPro ? mot.data : pro.data) as BankRow;

  const accountNumber =
    patch.bankAccountNumber !== undefined
      ? digits(patch.bankAccountNumber)
      : digits(own?.bank_account_number) || digits(other?.bank_account_number);
  const bankCode =
    String(patch.bankCode ?? "").trim() ||
    String(own?.bank_code ?? "").trim() ||
    String(other?.bank_code ?? "").trim();

  const cleared: BankNameColumns = { bank_account_name: null, bank_account_resolved_at: null };
  if (accountNumber.length !== 10 || !bankCode) return { ok: true, columns: cleared };

  const sameAccount = (row: BankRow) =>
    Boolean(row) &&
    digits(row?.bank_account_number) === accountNumber &&
    String(row?.bank_code ?? "").trim() === bankCode;
  const confirmed = [own, other].find(
    (row) => sameAccount(row) && row?.bank_account_resolved_at && row?.bank_account_name,
  );
  if (confirmed) {
    return {
      ok: true,
      columns: {
        bank_account_name: confirmed.bank_account_name,
        bank_account_resolved_at: confirmed.bank_account_resolved_at,
      },
    };
  }

  const decision = await bankNameForSave({
    accountNumber,
    bankCode,
    typedName: patch.bankAccountName,
    onUnavailable: "save_unresolved",
  });
  if (!decision.ok) {
    return { ok: false, response: apiFail(decision.message, decision.status, decision.code) };
  }
  if (!decision.accountName) {
    // Bank unreachable. A legacy row for this same account keeps what it has.
    return { ok: true, columns: sameAccount(own) ? {} : cleared };
  }
  return {
    ok: true,
    columns: {
      bank_account_name: decision.accountName,
      bank_account_resolved_at: decision.resolvedAt,
    },
  };
}

/**
 * The bank-confirmed holder name for a stored account, or null.
 *
 * A row that is already confirmed is returned as is. A row that is not
 * (legacy self-declared name, or saved while the bank was unreachable) is
 * resolved now and stored, so nothing is ever paid against a typed name.
 * Never throws; null means "do not pay this account yet".
 */
export async function confirmedBankName(
  admin: SupabaseClient,
  userId: string,
  row: BankRow,
): Promise<string | null> {
  const accountNumber = digits(row?.bank_account_number);
  const bankCode = String(row?.bank_code ?? "").trim();
  if (accountNumber.length !== 10 || !bankCode) return null;
  const stored = String(row?.bank_account_name ?? "").trim();
  if (row?.bank_account_resolved_at && stored) return stored;

  try {
    const decision = await bankNameForSave({
      accountNumber,
      bankCode,
      typedName: stored,
      onUnavailable: "save_unresolved",
    });
    if (!decision.ok || !decision.accountName) return null;
    const columns = {
      bank_account_name: decision.accountName,
      bank_account_resolved_at: decision.resolvedAt,
    };
    // Both role rows share one bank; stamp whichever hold this account.
    for (const table of ["motorist_profiles", "repair_pro_profiles"] as const) {
      const { error } = await admin
        .from(table)
        .update(columns)
        .eq("user_id", userId)
        .eq("bank_account_number", accountNumber)
        .eq("bank_code", bankCode);
      if (error) console.error(`[bank-name] confirmed name not stored on ${table}: ${error.message}`);
    }
    const { refreshBankNameMatch } = await import("@/lib/server/identity/bank-name-match");
    await refreshBankNameMatch(admin, userId, decision.accountName);
    return decision.accountName;
  } catch (e) {
    console.error("[bank-name] confirm failed", e);
    return null;
  }
}
