import "server-only";
import { apiFail } from "@/lib/server/api-json";
import type { createServiceSupabase } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceSupabase>;

type OnFile = { num: string; code: string };

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

/**
 * Decide whether a generic profile save may touch the payout / refund destination.
 *
 * The app sends the current bank values on every save, so unchanged values must pass.
 * What must not pass without proof is CHANGING an account that is already on file:
 * that goes through POST /api/security/action (change_bank) with a bank-change proof.
 *
 *  - Nothing on file for this login            -> allowed (first-time setup, signup, role donor copy).
 *  - The patch matches a bank already on file  -> allowed (unchanged; either role's row counts,
 *                                                  because a login shares one bank across roles).
 *  - The patch points at a different account   -> rejected (403).
 *  - Fields that are absent from the patch are not compared. A stored bank code that is
 *    empty can be filled in. Account NAME / bank NAME edits never move money and are not gated.
 *
 * Returns the response to send, or null to carry on. Fails closed on a lookup error.
 */
export async function rejectBankDestinationChange(
  sb: Db,
  userId: string,
  patch: { bankAccountNumber?: string; bankCode?: string },
): Promise<Response | null> {
  const patchNum = patch.bankAccountNumber === undefined ? undefined : digits(patch.bankAccountNumber);
  const patchCode = patch.bankCode === undefined ? undefined : String(patch.bankCode).trim();
  if (patchNum === undefined && patchCode === undefined) return null;

  const [mot, pro] = await Promise.all([
    sb.from("motorist_profiles").select("bank_code, bank_account_number").eq("user_id", userId).maybeSingle(),
    sb.from("repair_pro_profiles").select("bank_code, bank_account_number").eq("user_id", userId).maybeSingle(),
  ]);
  if (mot.error || pro.error) {
    return apiFail("Could not check your bank details. Please try again.", 503, "bank_check_failed");
  }

  const onFile: OnFile[] = [mot.data, pro.data]
    .map((r) => ({
      num: digits((r as { bank_account_number?: string } | null)?.bank_account_number),
      code: String((r as { bank_code?: string } | null)?.bank_code ?? "").trim(),
    }))
    .filter((r) => r.num.length === 10);

  // Nothing on file: this is the first-time setup.
  if (onFile.length === 0) return null;

  const matchesOne = onFile.some(
    (f) =>
      (patchNum === undefined || patchNum === f.num) &&
      (patchCode === undefined || f.code === "" || patchCode === f.code),
  );
  if (matchesOne) return null;

  return apiFail(
    "Changing your bank account needs a security code. Open Payments → Bank account and verify to change it.",
    403,
    "bank_change_requires_verification",
  );
}
