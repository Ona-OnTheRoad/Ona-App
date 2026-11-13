/**
 * Client helpers for Nigeria NIN / BVN verification API routes.
 */

export type NgIdVerifyResponse = {
  ok: boolean;
  provider?: "prembly" | "local";
  mode?: "live" | "sandbox_format";
  message?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  reference?: string;
  code?: string;
};

async function postJson(
  url: string,
  body: Record<string, string>,
): Promise<NgIdVerifyResponse> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as NgIdVerifyResponse;
    if (!res.ok && !data.message) {
      return {
        ok: false,
        message: `Verification failed (${res.status}).`,
      };
    }
    return data;
  } catch {
    return { ok: false, message: "Network error during verification." };
  }
}

export function verifyNinApi(nin: string): Promise<NgIdVerifyResponse> {
  return postJson("/api/verify/nin", { nin });
}

export function verifyBvnApi(bvn: string): Promise<NgIdVerifyResponse> {
  return postJson("/api/verify/bvn", { bvn });
}

/**
 * Format pre-check before signup is submitted. The real NIN/BVN lookup now
 * runs once, on the server, inside POST /api/auth/signup, which rejects the
 * signup with a clear message when the provider refuses a number.
 * Empty fields are skipped (motorist optional).
 */
export async function verifySignupIds(input: {
  nin?: string;
  bvn?: string;
  requireBoth?: boolean;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const nin = input.nin?.replace(/\D/g, "") ?? "";
  const bvn = input.bvn?.replace(/\D/g, "") ?? "";

  if (input.requireBoth && nin.length !== 11) {
    return { ok: false, message: "NIN must be exactly 11 digits." };
  }
  if (input.requireBoth && bvn.length !== 11) {
    return { ok: false, message: "BVN must be exactly 11 digits." };
  }
  if (nin && nin.length !== 11) {
    return { ok: false, message: "NIN must be exactly 11 digits." };
  }
  if (bvn && bvn.length !== 11) {
    return { ok: false, message: "BVN must be exactly 11 digits." };
  }
  return { ok: true };
}
