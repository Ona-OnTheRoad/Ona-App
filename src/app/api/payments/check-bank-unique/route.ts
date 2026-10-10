import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { serverLogger } from "@/lib/server/structured-logger";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/env";
import { isBankAccountTaken } from "@/lib/server/payments/bank-lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  accountNumber: z.string().min(10).max(12),
  bankCode: z.string().min(1).max(20),
  /** Optional when omitted, try session cookie / not required for pre-check */
  access_token: z.string().optional(),
});

/**
 * Check whether bank code + NUBAN is free for this user.
 * POST { accountNumber, bankCode, access_token? }
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server not configured", 503);
  }

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return apiFail("Invalid body", 400);

    const accountNumber = parsed.data.accountNumber.replace(/\D/g, "");
    const bankCode = parsed.data.bankCode.trim();
    if (accountNumber.length !== 10 || !bankCode) {
      return apiFail("Need bank code and 10-digit account number.", 400);
    }

    let userId: string | null = null;
    const token = parsed.data.access_token?.trim();
    if (token) {
      const url = getSupabaseUrl();
      const anon = getSupabaseAnonKey();
      const userClient = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data } = await userClient.auth.getUser(token);
      userId = data.user?.id ?? null;
    } else {
      // Prefer browser session via anon client cookies is not available here
      // client should pass access_token when possible. Without userId we still
      // detect any existing link (stricter pre-check).
    }

    const taken = await isBankAccountTaken({
      accountNumber,
      bankCode,
      excludeUserId: userId,
    });

    if (taken) {
      return apiOk({
        available: false,
        message: "This bank is already used on another Ona account.",
      });
    }

    return apiOk({ available: true });
  } catch (e) {
    serverLogger.error("payment.bank_uniqueness.failed", { operation: "bank_uniqueness_check" }, req, e);
    return apiFail("Unable to check bank details right now", 500, "bank_check_failed");
  }
}
