import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/env";
import { createClient } from "@supabase/supabase-js";
import { switchIdentityRole } from "@/lib/server/identity/switch-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  access_token: z.string().min(10),
  target: z.enum(["motorist", "professional"]),
});

/**
 * POST /api/auth/switch-role
 * Smooth Motorist ↔ Repair Pro switch for the same logged-in user.
 * Requires a completed side-profile, switches active role, returns full profile.
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server is not configured", 503);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiFail("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiFail("Invalid switch request", 400);
  }

  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  const userClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(
    parsed.data.access_token,
  );
  if (userErr || !userData.user) {
    return apiFail(
      "Your login session needs a refresh. Try again, or sign in once more.",
      401,
      "session_expired",
    );
  }

  const userId = userData.user.id;
  const target = parsed.data.target;
  const role = target === "professional" ? "repair_pro" : "motorist";
  const result = await switchIdentityRole(userId, role);
  if (!result.ok) {
    switch (result.reason) {
      case "not_found":
        return apiFail("Profile not found", 404);
      case "inactive":
        return apiFail("This account is deactivated. Contact support.", 403);
      case "needs_signup":
        return apiFail(
          role === "motorist"
            ? "You don't have a Customer account yet."
            : "You don't have a Repair Pro account yet. Finish signup to go Live and receive jobs.",
          409,
          "needs_signup",
        );
      case "update_failed":
        return apiFail(result.message, 500);
    }
  }
  return apiOk(result.identity);
}
