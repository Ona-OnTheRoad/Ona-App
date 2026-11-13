/**
 * Browser calls for the signup "Verify your number" step. Client-safe: no server
 * imports. The server is the only authority; this only talks to it.
 */

export type SignupCodeSent =
  | { ok: true; phone: string; resendInSec: number }
  | {
      ok: false;
      error: string;
      code?: string;
      /** Seconds until another code may be requested (resend cooldown / rate limit). */
      retryAfterSec?: number;
    };

export type SignupCodeChecked =
  | { ok: true; phone: string; proof: string }
  | {
      ok: false;
      error: string;
      code?: string;
      failedAttempts?: number;
    };

type Envelope<T> = {
  ok?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    retryAfterSec?: number;
    failedAttempts?: number;
  };
} | null;

async function post<T>(path: string, body: unknown): Promise<{
  status: number;
  json: Envelope<T>;
} | null> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as Envelope<T>;
    return { status: res.status, json };
  } catch {
    return null;
  }
}

const NETWORK_ERROR = "Network error. Check your connection and try again.";

export async function sendSignupPhoneCode(phone: string): Promise<SignupCodeSent> {
  const r = await post<{ phone?: string; resendInSec?: number }>(
    "/api/auth/otp/signup/send",
    { phone },
  );
  if (!r) return { ok: false, error: NETWORK_ERROR, code: "network" };
  if (r.json?.ok && r.json.data?.phone) {
    return {
      ok: true,
      phone: r.json.data.phone,
      resendInSec: Number(r.json.data.resendInSec) || 30,
    };
  }
  return {
    ok: false,
    error: r.json?.error?.message || "Could not send the code. Try again.",
    code: r.json?.error?.code,
    retryAfterSec: r.json?.error?.retryAfterSec,
  };
}

export async function verifySignupPhoneCode(
  phone: string,
  code: string,
): Promise<SignupCodeChecked> {
  const r = await post<{ phone?: string; proof?: string }>(
    "/api/auth/otp/signup/verify",
    { phone, code },
  );
  if (!r) return { ok: false, error: NETWORK_ERROR, code: "network" };
  if (r.json?.ok && r.json.data?.proof && r.json.data.phone) {
    return { ok: true, phone: r.json.data.phone, proof: r.json.data.proof };
  }
  return {
    ok: false,
    error: r.json?.error?.message || "Could not check the code. Try again.",
    code: r.json?.error?.code,
    failedAttempts: r.json?.error?.failedAttempts,
  };
}
