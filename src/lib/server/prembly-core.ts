import "server-only";
/**
 * Shared types, config and response helpers for the Prembly client
 * (see prembly.ts for the NIN and BVN calls).
 *
 * Prembly (IdentityPass) Nigeria NIN + BVN verification.
 * Keys: PREMBLY_API_KEY (x-api-key), optional PREMBLY_APP_ID, optional PREMBLY_BASE_URL.
 *
 * Docs:
 * - NIN: POST /verification/vnin  body: { number_nin }
 * - BVN: POST /verification/bvn   body: { number }
 */

const DEFAULT_BASE = "https://api.prembly.com";

export type PremblyVerifyOk = {
  ok: true;
  provider: "prembly" | "local";
  mode: "live" | "sandbox_format";
  reference?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  rawStatus?: string;
};

export type PremblyVerifyFail = {
  ok: false;
  provider: "prembly" | "local";
  mode: "live" | "sandbox_format";
  message: string;
  code?: string;
};

export type PremblyVerifyResult = PremblyVerifyOk | PremblyVerifyFail;

export function digitsOnly(v: string): string {
  return v.replace(/\D/g, "");
}

export function premblyConfig() {
  const apiKey =
    process.env.PREMBLY_API_KEY?.trim() ||
    process.env.IDENTITYPASS_API_KEY?.trim() ||
    "";
  const appId =
    process.env.PREMBLY_APP_ID?.trim() ||
    process.env.IDENTITYPASS_APP_ID?.trim() ||
    "";
  const baseUrl = (
    process.env.PREMBLY_BASE_URL?.trim() || DEFAULT_BASE
  ).replace(/\/$/, "");
  return { apiKey, appId, baseUrl, configured: Boolean(apiKey) };
}

export function headers(apiKey: string, appId: string): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-key": apiKey,
  };
  if (appId) h["app-id"] = appId;
  return h;
}

export function pickName(data: Record<string, unknown> | undefined): {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
} {
  if (!data) return {};
  const first =
    (data.firstname as string) ||
    (data.first_name as string) ||
    (data.firstName as string) ||
    "";
  const last =
    (data.surname as string) ||
    (data.last_name as string) ||
    (data.lastName as string) ||
    "";
  const mid = (data.middlename as string) || (data.middle_name as string) || "";
  const phone =
    (data.telephoneno as string) ||
    (data.phone as string) ||
    (data.phoneNumber as string) ||
    undefined;
  const parts = [first, mid, last].map((s) => s.trim()).filter(Boolean);
  return {
    firstName: first || undefined,
    lastName: last || undefined,
    fullName: parts.length ? parts.join(" ") : undefined,
    phone,
  };
}

export function isSuccessBody(json: Record<string, unknown>): boolean {
  if (
    json.status === true ||
    json.status === "success" ||
    json.status === "SUCCESS"
  )
    return true;
  const verification = json.verification as Record<string, unknown> | undefined;
  if (
    verification?.status === "VERIFIED" ||
    verification?.status === "verified"
  )
    return true;
  const code = String(json.response_code ?? json.responseCode ?? "");
  if (code === "00" || code === "0") return true;
  return false;
}

export const ID_LOOKUP_NOT_CONFIGURED = "NOT_CONFIGURED";

/**
 * Local format-only check used when Prembly keys are not configured.
 * Keeps signup usable in development without live NIMC/NIBSS calls.
 * In production it fails closed: a well-formed number is not a verified one.
 */
export function localFormatCheck(
  kind: "nin" | "bvn",
  number: string,
): PremblyVerifyResult {
  if (process.env.NODE_ENV === "production") {
    return {
      ok: false,
      provider: "local",
      mode: "sandbox_format",
      message: `${kind.toUpperCase()} verification is not available right now. Please try again later.`,
      code: ID_LOOKUP_NOT_CONFIGURED,
    };
  }
  const d = digitsOnly(number);
  if (d.length !== 11) {
    return {
      ok: false,
      provider: "local",
      mode: "sandbox_format",
      message: `${kind.toUpperCase()} must be exactly 11 digits.`,
      code: "FORMAT",
    };
  }
  // Reject obviously fake all-same-digit strings in local mode
  if (/^(\d)\1{10}$/.test(d)) {
    return {
      ok: false,
      provider: "local",
      mode: "sandbox_format",
      message: `Enter a valid ${kind.toUpperCase()} (not all identical digits).`,
      code: "FORMAT",
    };
  }
  return {
    ok: true,
    provider: "local",
    mode: "sandbox_format",
    reference: `local-${kind}-${d.slice(-4)}`,
    rawStatus: "FORMAT_OK",
  };
}
