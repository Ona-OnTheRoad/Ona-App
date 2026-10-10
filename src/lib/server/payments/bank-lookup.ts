import "server-only";
/**
 * Bank/identity lookups shared by payment routes (init, refund,
 * bank-uniqueness check) and payout-settlement. Centralizes reads against
 * motorist_profiles/repair_pro_profiles/profiles/payout_methods that were
 * previously duplicated inline in each caller.
 */

import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { serverLogger } from "@/lib/server/structured-logger";
import type { IdentityCheck } from "@/lib/server/payments/self-payment-guard";

export async function loadMotoristBankCode(
  motoristId: string,
): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const sb = createServiceSupabase();
    const { data } = await sb
      .from("motorist_profiles")
      .select("bank_code")
      .eq("user_id", motoristId)
      .maybeSingle();
    return (data?.bank_code as string) || null;
  } catch {
    return null;
  }
}

export async function loadProBankCode(
  repairProId: string,
): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const sb = createServiceSupabase();
    const { data } = await sb
      .from("repair_pro_profiles")
      .select("bank_code")
      .eq("user_id", repairProId)
      .maybeSingle();
    return (data?.bank_code as string) || null;
  } catch {
    return null;
  }
}

export type BankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
};

export async function loadMotoristBankDetails(
  motoristId: string,
): Promise<BankDetails | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const sb = createServiceSupabase();
    const { data } = await sb
      .from("motorist_profiles")
      .select("bank_name, bank_account_name, bank_account_number, bank_code")
      .eq("user_id", motoristId)
      .maybeSingle();
    if (!data) return null;
    return {
      bankName: (data.bank_name as string) || "",
      accountName: (data.bank_account_name as string) || "",
      accountNumber: String(data.bank_account_number || "").replace(/\D/g, ""),
      bankCode: String(data.bank_code || "").trim(),
    };
  } catch (error) {
    serverLogger.warn(
      "payment.bank_lookup.motorist_details_unavailable",
      { operation: "load_motorist_bank_details" },
      undefined,
      error,
    );
    return null;
  }
}

export async function loadProBankDetails(
  repairProId: string | null,
): Promise<{
  bankCode: string;
  accountNumber: string;
  accountName: string;
} | null> {
  if (!repairProId || !isSupabaseAdminConfigured()) return null;
  try {
    const sb = createServiceSupabase();
    const { data } = await sb
      .from("repair_pro_profiles")
      .select("bank_code, bank_account_number, bank_account_name")
      .eq("user_id", repairProId)
      .maybeSingle();
    if (!data) return null;
    const bankCode = String(data.bank_code || "").trim();
    const accountNumber = String(data.bank_account_number || "").replace(
      /\D/g,
      "",
    );
    const accountName = String(data.bank_account_name || "").trim();
    if (!bankCode || accountNumber.length < 10 || !accountName) return null;
    return { bankCode, accountNumber, accountName };
  } catch {
    return null;
  }
}

/** Identity fields needed by self-payment-guard's isSamePerson check. */
export async function loadIdentityCheck(
  userId: string,
  role: "motorist" | "repair_pro",
): Promise<IdentityCheck> {
  const table = role === "motorist" ? "motorist_profiles" : "repair_pro_profiles";
  const empty: IdentityCheck = { fullName: "", ninLast4: null, bvnLast4: null };
  if (!isSupabaseAdminConfigured()) return empty;
  try {
    const sb = createServiceSupabase();
    const [nameRes, idRes] = await Promise.all([
      sb.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
      sb
        .from(table)
        .select("nin_last4, bvn_last4")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    return {
      fullName: (nameRes.data?.full_name as string | undefined) || "",
      ninLast4: (idRes.data?.nin_last4 as string | undefined) || null,
      bvnLast4: (idRes.data?.bvn_last4 as string | undefined) || null,
    };
  } catch {
    return empty;
  }
}

/** True if another user already has this bank code + account number saved. */
export async function isBankAccountTaken(opts: {
  accountNumber: string;
  bankCode: string;
  excludeUserId?: string | null;
}): Promise<boolean> {
  const accountNumber = opts.accountNumber.replace(/\D/g, "");
  const bankCode = opts.bankCode.trim();
  if (accountNumber.length !== 10 || !bankCode) return false;
  if (!isSupabaseAdminConfigured()) return false;

  const excludeUserId = opts.excludeUserId || null;
  const match = (row: {
    user_id?: string;
    bank_code?: string | null;
    bank_account_number?: string | null;
  }) => {
    if (excludeUserId && row.user_id === excludeUserId) return false;
    const rCode = String(row.bank_code || "").trim();
    const rNum = String(row.bank_account_number || "").replace(/\D/g, "");
    return rCode === bankCode && rNum === accountNumber;
  };

  const sb = createServiceSupabase();
  const [motRes, proRes, pmRes] = await Promise.all([
    sb
      .from("motorist_profiles")
      .select("user_id, bank_code, bank_account_number")
      .eq("bank_account_number", accountNumber)
      .limit(20),
    sb
      .from("repair_pro_profiles")
      .select("user_id, bank_code, bank_account_number")
      .eq("bank_account_number", accountNumber)
      .limit(20),
    sb
      .from("payout_methods")
      .select("user_id, bank_code, account_number_last4")
      .eq("account_number_last4", accountNumber.slice(-4))
      .limit(20),
  ]);

  // Canonical payout_methods stores last-4 only combine bank_code + last4.
  const pmMatch = (pmRes.data || []).some((row) => {
    const r = row as {
      user_id?: string;
      bank_code?: string | null;
      account_number_last4?: string | null;
    };
    if (excludeUserId && r.user_id === excludeUserId) return false;
    return (
      String(r.bank_code || "").trim() === bankCode &&
      String(r.account_number_last4 || "").trim() === accountNumber.slice(-4)
    );
  });

  return (motRes.data || []).some(match) || (proRes.data || []).some(match) || pmMatch;
}
