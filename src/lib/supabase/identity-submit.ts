import { SESSION_RELOGIN_MESSAGE } from "@/lib/supabase/session";
import type { AccountType } from "@/lib/types";

/**
 * ID submission goes through the server only. The browser never writes
 * `*_verified` or review-status fields: the server (or Care) decides.
 */
export type IdentitySubmission = {
  accountType: AccountType;
  /** Primary ID number (NIN for NG, any charset elsewhere). */
  primaryId: string;
  bankId?: string;
  countryIso?: string;
  govIdKind?: string;
  govIdFrontUrl?: string;
  govIdBackUrl?: string;
  accessToken?: string | null;
};

async function postVerify(
  path: string,
  body: Record<string, unknown>,
): Promise<string | null> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string };
    } | null;
    return json?.ok
      ? null
      : json?.error?.message || "Could not submit ID for review.";
  } catch {
    return "Network error submitting ID.";
  }
}

export async function backendSaveIdentityVerification(
  input: IdentitySubmission,
): Promise<string | null> {
  if (!input.accessToken) return SESSION_RELOGIN_MESSAGE;

  if (input.accountType === "professional") {
    return postVerify("/api/verify/pro-id", {
      access_token: input.accessToken,
      kind: "gov_id",
      govIdKind: input.govIdKind,
      govIdNumber: input.primaryId,
      govIdFrontUrl: input.govIdFrontUrl,
      govIdBackUrl: input.govIdBackUrl,
    });
  }

  return postVerify("/api/verify/customer-id", {
    access_token: input.accessToken,
    primaryId: input.primaryId,
    bankId: input.bankId,
    countryIso: input.countryIso,
    govIdKind: input.govIdKind,
    govIdFrontUrl: input.govIdFrontUrl,
    govIdBackUrl: input.govIdBackUrl,
  });
}
