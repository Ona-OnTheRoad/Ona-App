/**
 * Client for changing the payout / refund bank account:
 *   1. POST /api/security/change-bank/send-code    code to the phone on the account
 *   2. POST /api/security/change-bank/verify-code  code -> short-lived bankProof
 *   3. POST /api/security/action (change_bank)     bank details + bankProof
 */
type Fail = { ok: false; error: string; code?: string };

type ApiJson = {
  ok?: boolean;
  error?: { message?: string; code?: string };
  data?: Record<string, unknown>;
} | null;

async function post(url: string, body: unknown): Promise<{ json: ApiJson } | { netError: true }> {
  try {
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { json: (await res.json().catch(() => null)) as ApiJson };
  } catch {
    return { netError: true };
  }
}

const fail = (json: ApiJson, fallback: string): Fail => ({
  ok: false,
  error: json?.error?.message || fallback,
  code: json?.error?.code,
});

export async function sendBankChangeCode(): Promise<
  { ok: true; resendInSec: number; phone: string } | Fail
> {
  const r = await post("/api/security/change-bank/send-code", {});
  if ("netError" in r) return { ok: false, error: "Network error. Try again." };
  if (!r.json?.ok) return fail(r.json, "Could not send the code. Try again.");
  return {
    ok: true,
    resendInSec: Number(r.json.data?.resendInSec ?? 30),
    phone: String(r.json.data?.phone ?? ""),
  };
}

export async function verifyBankChangeCode(code: string): Promise<{ ok: true; bankProof: string } | Fail> {
  const r = await post("/api/security/change-bank/verify-code", { code });
  if ("netError" in r) return { ok: false, error: "Network error. Try again." };
  const proof = r.json?.data?.bankProof;
  if (!r.json?.ok || typeof proof !== "string" || !proof) {
    return fail(r.json, "Verification failed.");
  }
  return { ok: true, bankProof: proof };
}

export type BankDetailsInput = {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankCode: string;
};

export async function changeBankAccount(input: {
  accessToken: string;
  bank: BankDetailsInput;
  bankProof: string;
}): Promise<{ ok: true } | Fail> {
  const r = await post("/api/security/action", {
    action: "change_bank",
    accessToken: input.accessToken,
    newValue: JSON.stringify(input.bank),
    bankProof: input.bankProof,
  });
  if ("netError" in r) return { ok: false, error: "Network error. Try again." };
  if (!r.json?.ok) return fail(r.json, "Bank update failed.");
  return { ok: true };
}
