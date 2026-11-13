import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  lookupId,
  type IdKind,
  type IdLookupRecord,
} from "@/lib/server/identity/id-lookup";

/**
 * Which provider lookup, if any, fits a submitted government ID. Only
 * Nigerian 11-digit NIN and BVN numbers can be looked up.
 */
export function idKindForGovId(
  govIdKind: string | null | undefined,
  number: string,
  countryIso: string = "NG",
): IdKind | null {
  if (countryIso.toUpperCase() !== "NG") return null;
  if (!/^\d{11}$/.test(number.trim())) return null;
  const kind = String(govIdKind || "").toLowerCase();
  if (kind === "national_id" || kind === "nin") return "nin";
  if (kind === "bvn") return "bvn";
  return null;
}

/**
 * Look up the numbers a signed-in user just submitted for Care review and
 * return the evidence records. Never throws and never blocks the submission:
 * a rejected or unavailable lookup is itself recorded for Care.
 */
export async function lookupForSubmission(
  admin: SupabaseClient,
  userId: string,
  items: { kind: IdKind | null; number: string }[],
  bankAccountName?: string | null,
): Promise<IdLookupRecord[]> {
  const wanted = items.filter(
    (item): item is { kind: IdKind; number: string } => item.kind !== null,
  );
  if (wanted.length === 0) return [];
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    const names = {
      profileName: (profile?.full_name as string | null | undefined) ?? null,
      bankAccountName: bankAccountName ?? null,
    };
    const records: IdLookupRecord[] = [];
    for (const item of wanted) {
      records.push(await lookupId(item.kind, item.number.trim(), names));
    }
    return records;
  } catch (e) {
    console.error("[id-lookup] submission lookup failed", e);
    return [];
  }
}
