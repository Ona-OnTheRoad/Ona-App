import "server-only";

/**
 * Throwaway anon client for password checks and the browser session.
 * signInWithPassword keeps the session on the client it runs on, and later
 * queries on that client send the user's JWT, so on the service client every
 * write would run as `authenticated` (blocked by migration 077).
 */
export async function passwordClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const { getSupabaseAnonKey, getSupabaseUrl } =
    await import("@/lib/supabase/env");
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function last4(digits: string | undefined): string | null {
  const d = (digits || "").replace(/\D/g, "");
  if (d.length < 4) return null;
  return d.slice(-4);
}

/** Strip huge data-URLs from skill answers (certs stay on dedicated columns). */
export function slimSkillAnswers(
  raw: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "certificationUpload" && v && typeof v === "object") {
      const file = v as { name?: string; mime?: string; dataUrl?: string };
      out[k] = {
        name: file.name || "certificate",
        mime: file.mime || undefined,
        // Never store multi-MB base64 in skills jsonb breaks vulcanizer/pro signup
        hasFile: Boolean(file.dataUrl || file.name),
      };
      continue;
    }
    if (typeof v === "string" && v.startsWith("data:") && v.length > 8_000) {
      out[k] = "[file omitted]";
      continue;
    }
    out[k] = v;
  }
  return out;
}

/** Cap cert data URL size so Postgres / request body does not fail signup. */
export function capCertDataUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  // ~400KB text enough for compressed photo; larger payloads fail many hosts
  if (url.length > 400_000) return null;
  return url;
}

export function friendlyAuthError(message: string): {
  message: string;
  status: number;
  code: string;
} {
  const m = message || "Signup failed";
  const lower = m.toLowerCase();
  if (
    lower.includes("only request this after") ||
    lower.includes("rate limit") ||
    lower.includes("over_email_send") ||
    lower.includes("email rate limit")
  ) {
    return {
      message:
        "Too many sign-up attempts from this network. Wait about a minute, then try once more with the same details.",
      status: 429,
      code: "rate_limited",
    };
  }
  if (
    lower.includes("already been registered") ||
    lower.includes("already registered") ||
    lower.includes("user already exists")
  ) {
    return {
      message:
        "An account with this email already exists. Log in instead, or use a different email.",
      status: 409,
      code: "email_exists",
    };
  }
  if (lower.includes("password")) {
    return { message: m, status: 400, code: "weak_password" };
  }
  return { message: m, status: 400, code: "signup_failed" };
}

export async function logSignupEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  row: {
    email?: string | null;
    full_name?: string | null;
    phone?: string | null;
    account_type?: string | null;
    success: boolean;
    error_message?: string | null;
    user_id?: string | null;
    meta?: Record<string, unknown>;
  },
) {
  try {
    await supabase.from("signup_events").insert({
      email: row.email ?? null,
      full_name: row.full_name ?? null,
      phone: row.phone ?? null,
      account_type: row.account_type ?? null,
      success: row.success,
      error_message: row.error_message ?? null,
      user_id: row.user_id ?? null,
      meta: row.meta ?? {},
    });
  } catch {
    /* never block signup on logging */
  }
}
