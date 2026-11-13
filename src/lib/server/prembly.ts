import "server-only";
/**
 * Prembly (IdentityPass) Nigeria NIN + BVN verification calls.
 * Types, config and response helpers live in prembly-core.ts.
 */
import {
  digitsOnly,
  headers,
  isSuccessBody,
  localFormatCheck,
  pickName,
  premblyConfig,
  type PremblyVerifyResult,
} from "@/lib/server/prembly-core";

export {
  ID_LOOKUP_NOT_CONFIGURED,
  type PremblyVerifyFail,
  type PremblyVerifyOk,
  type PremblyVerifyResult,
} from "@/lib/server/prembly-core";

export async function verifyNinWithPrembly(
  nin: string,
): Promise<PremblyVerifyResult> {
  const d = digitsOnly(nin);
  if (d.length !== 11) {
    return {
      ok: false,
      provider: "local",
      mode: "sandbox_format",
      message: "NIN must be exactly 11 digits.",
      code: "FORMAT",
    };
  }

  const { apiKey, appId, baseUrl, configured } = premblyConfig();
  if (!configured) return localFormatCheck("nin", d);

  try {
    // Prefer classic NIN endpoint; fall back to vNIN body shape if needed
    const url = `${baseUrl}/verification/nin`;
    const res = await fetch(url, {
      method: "POST",
      headers: headers(apiKey, appId),
      body: JSON.stringify({ number: d }),
      cache: "no-store",
    });

    let json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    // Some tenants use /verification/vnin with number_nin
    if (!res.ok || !isSuccessBody(json)) {
      const res2 = await fetch(`${baseUrl}/verification/vnin`, {
        method: "POST",
        headers: headers(apiKey, appId),
        body: JSON.stringify({ number_nin: d }),
        cache: "no-store",
      });
      json = (await res2.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res2.ok && !isSuccessBody(json)) {
        const msg =
          (json.detail as string) ||
          (json.message as string) ||
          (json.error as string) ||
          `NIN verification failed (${res2.status || res.status}).`;
        return {
          ok: false,
          provider: "prembly",
          mode: "live",
          message: msg,
          code: String(json.response_code ?? res2.status),
        };
      }
    }

    if (!isSuccessBody(json)) {
      return {
        ok: false,
        provider: "prembly",
        mode: "live",
        message:
          (json.detail as string) ||
          (json.message as string) ||
          "NIN could not be verified.",
        code: String(json.response_code ?? ""),
      };
    }

    const data =
      (json.nin_data as Record<string, unknown>) ||
      (json.data as Record<string, unknown>) ||
      undefined;
    const names = pickName(data);
    const verification = json.verification as
      Record<string, unknown> | undefined;

    return {
      ok: true,
      provider: "prembly",
      mode: "live",
      reference: String(verification?.reference ?? json.reference ?? ""),
      ...names,
      rawStatus: String(verification?.status ?? "VERIFIED"),
    };
  } catch (e) {
    return {
      ok: false,
      provider: "prembly",
      mode: "live",
      message:
        e instanceof Error
          ? `NIN verification error: ${e.message}`
          : "NIN verification network error.",
      code: "NETWORK",
    };
  }
}

export async function verifyBvnWithPrembly(
  bvn: string,
): Promise<PremblyVerifyResult> {
  const d = digitsOnly(bvn);
  if (d.length !== 11) {
    return {
      ok: false,
      provider: "local",
      mode: "sandbox_format",
      message: "BVN must be exactly 11 digits.",
      code: "FORMAT",
    };
  }

  const { apiKey, appId, baseUrl, configured } = premblyConfig();
  if (!configured) return localFormatCheck("bvn", d);

  try {
    const attempts: { path: string; body: Record<string, string> }[] = [
      { path: "/verification/bvn", body: { number: d } },
      { path: "/verification/bvn_validation", body: { number: d } },
    ];

    let lastJson: Record<string, unknown> = {};
    let lastStatus = 0;

    for (const attempt of attempts) {
      const res = await fetch(`${baseUrl}${attempt.path}`, {
        method: "POST",
        headers: headers(apiKey, appId),
        body: JSON.stringify(attempt.body),
        cache: "no-store",
      });
      lastStatus = res.status;
      lastJson = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (res.ok && isSuccessBody(lastJson)) break;
    }

    if (!isSuccessBody(lastJson)) {
      return {
        ok: false,
        provider: "prembly",
        mode: "live",
        message:
          (lastJson.detail as string) ||
          (lastJson.message as string) ||
          (lastJson.error as string) ||
          `BVN verification failed (${lastStatus}).`,
        code: String(lastJson.response_code ?? lastStatus),
      };
    }

    const data = (lastJson.data as Record<string, unknown>) || lastJson;
    const names = pickName(data as Record<string, unknown>);
    const verification = lastJson.verification as
      Record<string, unknown> | undefined;

    return {
      ok: true,
      provider: "prembly",
      mode: "live",
      reference: String(verification?.reference ?? lastJson.reference ?? ""),
      ...names,
      rawStatus: String(verification?.status ?? "VERIFIED"),
    };
  } catch (e) {
    return {
      ok: false,
      provider: "prembly",
      mode: "live",
      message:
        e instanceof Error
          ? `BVN verification error: ${e.message}`
          : "BVN verification network error.",
      code: "NETWORK",
    };
  }
}

export function isPremblyConfigured(): boolean {
  return premblyConfig().configured;
}
