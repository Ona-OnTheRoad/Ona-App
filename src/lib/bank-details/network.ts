import type { BankOption } from "./banks";
import { NG_BANKS } from "./banks";

/** Client: load banks for a country (geo-fenced Flutterwave list). */
export async function fetchCountryBanks(countryIso: string = "NG"): Promise<{
  banks: BankOption[];
  source: string;
  country: string;
}> {
  const iso = (countryIso || "NG").toUpperCase().slice(0, 2);
  try {
    const res = await fetch(
      `/api/payments/banks?country=${encodeURIComponent(iso)}`,
      { cache: "default" },
    );
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { banks?: BankOption[]; source?: string; country?: string };
    };
    if (json?.ok && Array.isArray(json.data?.banks) && json.data.banks.length) {
      return {
        banks: json.data.banks,
        source: json.data.source || "api",
        country: json.data.country || iso,
      };
    }
  } catch {
    /* fallback */
  }
  return {
    banks: iso === "NG" ? NG_BANKS : NG_BANKS,
    source: "static_fallback",
    country: iso,
  };
}

/** @deprecated Prefer fetchCountryBanks kept for older imports */
export async function fetchNigeriaBanks(): Promise<{
  banks: BankOption[];
  source: string;
}> {
  const r = await fetchCountryBanks("NG");
  return { banks: r.banks, source: r.source };
}

/**
 * Resolve NUBAN account name (like bank apps) via Flutterwave.
 * Requires bank code + 10-digit account number.
 */
/**
 * Client check: is this bank already linked to another Ona user?
 * Server still enforces on save.
 */
export async function checkBankAccountAvailable(input: {
  accountNumber: string;
  bankCode: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const accountNumber = input.accountNumber.replace(/\D/g, "");
  const bankCode = input.bankCode.trim();
  if (accountNumber.length !== 10 || !bankCode) {
    return { ok: true };
  }
  try {
    let access_token: string | undefined;
    try {
      const { getAppSupabase } = await import("@/lib/supabase/app-client");
      const sb = getAppSupabase();
      if (sb) {
        const { data } = await sb.auth.getSession();
        access_token = data.session?.access_token;
      }
    } catch {
      /* optional */
    }
    const res = await fetch("/api/payments/check-bank-unique", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(access_token
          ? {
              Authorization: `Bearer ${access_token}`,
              "x-access-token": access_token,
            }
          : {}),
      },
      body: JSON.stringify({ accountNumber, bankCode, access_token }),
      credentials: "include",
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: { available?: boolean };
      error?: { message?: string };
    } | null;
    if (json?.ok && json.data?.available === false) {
      return {
        ok: false,
        error:
          (json.data as { message?: string })?.message ||
          json.error?.message ||
          "This bank is already used on another Ona account.",
      };
    }
    if (json?.ok) return { ok: true };
    // If endpoint fails open for UX; server still blocks save
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function resolveNigeriaAccountName(input: {
  accountNumber: string;
  bankCode: string;
}): Promise<{ ok: true; accountName: string } | { ok: false; error: string }> {
  const accountNumber = input.accountNumber.replace(/\D/g, "");
  const bankCode = input.bankCode.trim();
  if (accountNumber.length !== 10) {
    return { ok: false, error: "Enter a 10-digit account number." };
  }
  if (!bankCode) {
    return { ok: false, error: "Select a bank first." };
  }
  try {
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch("/api/payments/resolve-account", {
      method: "POST",
      body: JSON.stringify({ accountNumber, bankCode }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: { accountName?: string };
      error?: { message?: string };
    } | null;
    if (json?.ok && json.data?.accountName) {
      return { ok: true, accountName: String(json.data.accountName).trim() };
    }
    return {
      ok: false,
      error:
        json?.error?.message ||
        "Could not find account name. Check bank and number.",
    };
  } catch {
    return { ok: false, error: "Network error looking up account." };
  }
}
