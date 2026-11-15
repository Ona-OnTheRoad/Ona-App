import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { compareNames } from "@/lib/server/identity/name-match";

const TABLES = ["motorist_profiles", "repair_pro_profiles"] as const;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Returns `gov_id_meta` with every stored NIN/BVN lookup record re-compared
 * against the bank-confirmed account name, or null when nothing changes.
 * Uses the holder name already on the record: no provider is called.
 * With no confirmed name the comparison is `unknown`, never `match`.
 */
export function withBankNameMatch(
  meta: unknown,
  resolvedName: string | null,
): Record<string, unknown> | null {
  const base = asObject(meta);
  const idLookup = { ...asObject(base.idLookup) };
  let changed = false;
  for (const kind of ["nin", "bvn"]) {
    const record = asObject(idLookup[kind]);
    if (!record.kind) continue;
    const holder = String(record.matchedName || "");
    const next =
      record.status === "verified" && holder && resolvedName
        ? compareNames({ fullName: holder }, resolvedName)
        : "unknown";
    const nameMatch = asObject(record.nameMatch);
    if (nameMatch.bankAccount === next) continue;
    idLookup[kind] = { ...record, nameMatch: { ...nameMatch, bankAccount: next } };
    changed = true;
  }
  return changed ? { ...base, idLookup } : null;
}

/**
 * After the stored bank account name changes, bring the ID evidence Care
 * sees in line with it. Best-effort: never throws, never blocks the save.
 */
export async function refreshBankNameMatch(
  admin: SupabaseClient,
  userId: string,
  resolvedName: string | null,
): Promise<void> {
  for (const table of TABLES) {
    try {
      const { data } = await admin
        .from(table)
        .select("gov_id_meta")
        .eq("user_id", userId)
        .maybeSingle();
      if (!data) continue;
      const next = withBankNameMatch(data.gov_id_meta, resolvedName);
      if (!next) continue;
      const { error } = await admin
        .from(table)
        .update({ gov_id_meta: next })
        .eq("user_id", userId);
      if (error) console.error(`[bank-name] match not refreshed on ${table}: ${error.message}`);
    } catch (e) {
      console.error("[bank-name] match refresh failed", e);
    }
  }
}
