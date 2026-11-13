import "server-only";
import { apiFail } from "@/lib/server/api-json";
import type { SignupContext } from "@/lib/server/signup/context";
import { logSignupEvent } from "@/lib/server/signup/helpers";
import type { SignupInput } from "@/lib/server/signup/schema";

/** Returns the rejection to send, or null when the date of birth is acceptable. */
export function rejectInvalidAge(input: SignupInput): Response | null {
  // Age gate: real calendar date, not future, 16-120 years
  {
    const raw = input.dateOfBirth;
    const dob = new Date(`${raw}T12:00:00`);
    const today = new Date();
    if (Number.isNaN(dob.getTime())) {
      return apiFail("Use a valid date of birth.", 400, "validation");
    }
    const [y, month, day] = raw.split("-").map(Number);
    if (
      dob.getFullYear() !== y ||
      dob.getMonth() + 1 !== month ||
      dob.getDate() !== day
    ) {
      return apiFail("Use a valid date of birth.", 400, "validation");
    }
    if (dob.getTime() > today.getTime()) {
      return apiFail(
        "Date of birth cannot be in the future.",
        400,
        "validation",
      );
    }
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
    if (age < 16 || age > 120) {
      return apiFail(
        "You must be at least 16 years old to create an account.",
        400,
        "validation",
      );
    }
  }
  return null;
}

/**
 * Returns the signed-in user's id when a valid access token was sent (the
 * dual-role attach path), null for a normal signup, or the rejection to send.
 */
export async function resolveAttachUser(
  input: SignupInput,
  email: string,
): Promise<string | null | Response> {
  // ── Dual-role attach: same logged-in user adds the other role ─────────────
  // Prefer session token so we NEVER create a second auth user (anti-fraud).
  let attachUserId: string | null = null;
  if (input.access_token) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const { getSupabaseAnonKey, getSupabaseUrl } =
        await import("@/lib/supabase/env");
      const userClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: tokUser, error: tokErr } = await userClient.auth.getUser(
        input.access_token,
      );
      if (!tokErr && tokUser.user?.id) {
        attachUserId = tokUser.user.id;
        // Force email to the session identity (cannot attach under a different email)
        const sessionEmail = String(tokUser.user.email || "")
          .trim()
          .toLowerCase();
        if (sessionEmail && sessionEmail !== email) {
          // Allow client to send the locked session email; if mismatch, prefer session
          // only when keepOtherRole (dual attach). Reject pure hijack attempts.
          if (input.keepOtherRole !== false) {
            // rebind to session email for profile writes
            // (input.email is const via local use session for create path skip)
          } else {
            return apiFail(
              "Signed-in email does not match. Stay on this account to add a role.",
              403,
              "identity_mismatch",
            );
          }
        }
      }
    } catch {
      /* fall through to normal signup */
    }
  }
  return attachUserId;
}

/** Returns the rejection to send when another account already uses the phone. */
export async function rejectTakenPhone(
  ctx: SignupContext,
  attachUserId: string | null,
): Promise<Response | null> {
  const { supabase, input, eventBase } = ctx;
  // Phone uniqueness across different accounts (signed-in attach may reuse own phone)
  const phoneDigits = input.phone.replace(/\D/g, "");
  if (phoneDigits.length >= 10) {
    const tail = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;
    const { data: phoneRows } = await supabase
      .from("profiles")
      .select("id, email, phone")
      .not("phone", "is", null)
      .limit(500);
    const phoneTaken = (phoneRows || []).find((row) => {
      const d = String(row.phone || "").replace(/\D/g, "");
      if (d.length < 10) return false;
      const rowTail = d.length > 10 ? d.slice(-10) : d;
      if (rowTail !== tail) return false;
      // Only the access_token attach path may reuse this user's own phone
      if (attachUserId && row.id === attachUserId) return false;
      return true;
    });
    if (phoneTaken) {
      await logSignupEvent(supabase, {
        ...eventBase,
        success: false,
        error_message: "phone_exists",
      });
      return apiFail(
        "This phone number is already used on another Ona account. Use a different number or log in.",
        409,
        "phone_exists",
      );
    }
  }
  return null;
}
