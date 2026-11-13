/** Client for POST /api/security/change-contact/send-code (new phone / email verification code). */
export type SendChangeContactCodeResult =
  | { ok: true; resendInSec: number }
  | { ok: false; error: string; code?: string };

export async function sendChangeContactCode(input: {
  channel: "phone" | "email";
  target: string;
  identityProof: string;
}): Promise<SendChangeContactCodeResult> {
  try {
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch("/api/security/change-contact/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string; code?: string };
      data?: { resendInSec?: number };
    } | null;
    if (!json?.ok) {
      return {
        ok: false,
        error: json?.error?.message || "Could not send the code. Try again.",
        code: json?.error?.code,
      };
    }
    return { ok: true, resendInSec: json.data?.resendInSec ?? 30 };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}

/** Error codes from POST /api/security/action that mean "the code was wrong, stay on the code step". */
export const CODE_STEP_ERRORS = new Set([
  "otp_invalid",
  "otp_expired",
  "otp_missing",
  "otp_locked",
  "code_required",
]);
