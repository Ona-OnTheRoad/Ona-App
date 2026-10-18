import { rateLimitUnavailableResponse } from "@/lib/server/modules/rate-limit";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { apiFail, apiOk } from "@/lib/server/api-json";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import { loadLoginIdentity } from "@/lib/server/identity/login-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side email/password login reliable on Vercel.
 * Browser sets session from returned tokens; profile loaded via service role.
 */
const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function friendlyLoginError(message: string): string {
  const m = (message || "").toLowerCase();
  if (
    m.includes("invalid login") ||
    m.includes("invalid credentials") ||
    m.includes("wrong password") ||
    m.includes("user not found")
  ) {
    return "Email or password is incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email first, or try phone OTP log in.";
  }
  if (m.includes("too many") || m.includes("rate")) {
    return "Too many login attempts. Wait a minute and try again.";
  }
  return message || "Could not log in. Try again.";
}

export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return apiFail("Supabase is not configured", 503);
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiFail("Enter a valid email and password.", 400);
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    // Shared IP and email budgets across deployed workers.
    try {
      const { rateLimitAsync } =
        await import("@/lib/server/modules/rate-limit");
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const byIp = await rateLimitAsync({
        key: `login:ip:${ip}`,
        limit: 80,
        windowMs: 60_000,
      });
      if (!byIp.ok) {
        return apiFail(
          `Too many login attempts. Retry in ${byIp.retryAfterSec}s.`,
          429,
          "rate_limited",
        );
      }
      const byEmail = await rateLimitAsync({
        key: `login:email:${email}`,
        limit: 12,
        windowMs: 60_000,
      });
      if (!byEmail.ok) {
        return apiFail(
          `Too many login attempts for this email. Retry in ${byEmail.retryAfterSec}s.`,
          429,
          "rate_limited",
        );
      }
    } catch (error) {
      return rateLimitUnavailableResponse(error, req) || apiFail("Security checks unavailable", 503);
    }
    const url = getSupabaseUrl();
    const anon = getSupabaseAnonKey();

    const authClient = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return apiFail(friendlyLoginError(error?.message || "Login failed"), 401);
    }

    const userId = data.user.id;
    const loaded = await loadLoginIdentity(
      userId,
      email,
      (data.user.user_metadata || {}) as Record<string, unknown>,
    );

    if (loaded && "deactivated" in loaded && loaded.deactivated) {
      return apiFail(
        "This account has been deactivated. Contact support.",
        403,
        "deactivated",
      );
    }

    if (!loaded || !("profile" in loaded) || !loaded.profile) {
      return apiFail(
        "Account exists but profile could not be loaded. Contact support.",
        500,
      );
    }

    const { profile, hasMotorist, hasPro } = loaded;

    return apiOk({
      userId,
      profile,
      hasMotorist,
      hasPro,
      primaryAccountType: profile.primaryAccountType,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  } catch (e) {
    console.error("login route", e);
    return apiFail(e instanceof Error ? e.message : "Login failed", 500);
  }
}
