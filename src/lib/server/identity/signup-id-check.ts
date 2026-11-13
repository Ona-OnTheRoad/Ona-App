import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  lookupId,
  mergeIdLookup,
  type IdKind,
  type IdLookupRecord,
} from "@/lib/server/identity/id-lookup";

export type SignupIdCheck =
  | { ok: true; records: IdLookupRecord[] }
  | { ok: false; status: 422 | 503; code: string; message: string };

/**
 * Server-side NIN/BVN gate for signup. Only complete 11-digit numbers are
 * looked up. A provider rejection or an unreachable provider stops signup
 * before any account is created; a name mismatch does not (Care reviews it).
 */
export async function checkSignupIds(input: {
  nin?: string;
  bvn?: string;
  profileName?: string | null;
  bankAccountName?: string | null;
}): Promise<SignupIdCheck> {
  const records: IdLookupRecord[] = [];
  const numbers: [IdKind, string][] = [
    ["nin", (input.nin || "").replace(/\D/g, "")],
    ["bvn", (input.bvn || "").replace(/\D/g, "")],
  ];
  for (const [kind, number] of numbers) {
    if (number.length !== 11) continue;
    const record = await lookupId(kind, number, {
      profileName: input.profileName,
      bankAccountName: input.bankAccountName,
    });
    const label = kind.toUpperCase();
    if (record.status === "rejected") {
      return {
        ok: false,
        status: 422,
        code: "id_verification_failed",
        message: `${label} could not be verified. Check the number and try again.`,
      };
    }
    if (record.status === "unavailable") {
      return {
        ok: false,
        status: 503,
        code: "id_verification_unavailable",
        message: `${label} verification is not available right now. Please try again later.`,
      };
    }
    records.push(record);
  }
  return { ok: true, records };
}

/**
 * Keep the lookup evidence on the role row for Care. Best-effort: signup
 * must not fail because the evidence could not be written.
 */
export async function storeIdLookup(
  supabase: SupabaseClient,
  table: "motorist_profiles" | "repair_pro_profiles",
  userId: string,
  records: IdLookupRecord[],
): Promise<void> {
  if (records.length === 0) return;
  try {
    const { data } = await supabase
      .from(table)
      .select("gov_id_meta")
      .eq("user_id", userId)
      .maybeSingle();
    const { error } = await supabase
      .from(table)
      .update({ gov_id_meta: mergeIdLookup(data?.gov_id_meta, records) })
      .eq("user_id", userId);
    if (error) console.error(`[signup] id lookup not stored on ${table}: ${error.message}`);
  } catch (e) {
    console.error("[signup] id lookup store failed", e);
  }
}
