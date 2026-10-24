import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { getBearerToken, getUserFromToken } from "@/lib/server/auth-utils";
import { rateLimitUnavailableResponse } from "@/lib/server/modules/rate-limit";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ password: z.string().min(1).max(200) });

/**
 * Checks the signed-in user's own password (dual-role signup step 0) so a wrong
 * password fails before the user fills in the rest of the wizard.
 * Session-bound: only the caller's own account can be checked, and no tokens
 * are returned.
 */
export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return apiFail("Supabase is not configured", 503);
    }
    const user = await getUserFromToken(getBearerToken(req));
    if (!user?.email) {
      return apiFail("Sign in again to continue.", 401, "unauthorized");
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiFail("Enter your password.", 400);

    try {
      const { rateLimitAsync } =
        await import("@/lib/server/modules/rate-limit");
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const byIp = await rateLimitAsync({
        key: `verify-password:ip:${ip}`,
        limit: 40,
        windowMs: 60_000,
      });
      const byUser = await rateLimitAsync({
        key: `verify-password:user:${user.id}`,
        limit: 8,
        windowMs: 60_000,
      });
      const limited = !byIp.ok ? byIp : !byUser.ok ? byUser : null;
      if (limited) {
        return apiFail(
          `Too many attempts. Retry in ${limited.retryAfterSec}s.`,
          429,
          "rate_limited",
        );
      }
    } catch (error) {
      return (
        rateLimitUnavailableResponse(error, req) ||
        apiFail("Security checks unavailable", 503)
      );
    }

    const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.signInWithPassword({
      email: user.email.toLowerCase(),
      password: parsed.data.password,
    });
    // 400 (not 401) so the client's auth-refresh retry does not treat it as an expired session.
    if (error || data.user?.id !== user.id) {
      return apiFail(
        "That password doesn't match your Customer account",
        400,
        "password_required",
      );
    }
    return apiOk({ verified: true });
  } catch {
    return apiFail("Could not check your password. Try again.", 500);
  }
}
