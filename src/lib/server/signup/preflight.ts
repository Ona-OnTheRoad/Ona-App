import "server-only";
import { apiFail } from "@/lib/server/api-json";
import { findPhoneOwners } from "@/lib/server/otp/phone-owners";
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

export type AttachResolution = {
  attachUserId: string | null;
  /** Session email when dual-attach rebinds a mismatch; otherwise the submitted email. */
  email: string;
};

/**
 * Returns the signed-in user's id when a valid access token was sent (the
 * dual-role attach path), null for a normal signup, or the rejection to send.
 * On dual attach, a mismatched submitted email is rebound to the session email
 * unless keepOtherRole is explicitly false (then 403).
 */
export async function resolveAttachUser(
  input: SignupInput,
  email: string,
): Promise<AttachResolution | Response> {
  // ── Dual-role attach: same logged-in user adds the other role ─────────────
  // Prefer session token so we NEVER create a second auth user (anti-fraud).
  if (!input.access_token) {
    return { attachUserId: null, email };
  }
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
    if (tokErr || !tokUser.user?.id) {
      return { attachUserId: null, email };
    }
    const attachUserId = tokUser.user.id;
    const sessionEmail = String(tokUser.user.email || "")
      .trim()
      .toLowerCase();
    if (sessionEmail && sessionEmail !== email) {
      // Reject pure hijack attempts; dual attach rebinds to the session identity.
      if (input.keepOtherRole === false) {
        return apiFail(
          "Signed-in email does not match. Stay on this account to add a role.",
          403,
          "identity_mismatch",
        );
      }
      return { attachUserId, email: sessionEmail };
    }
    return { attachUserId, email };
  } catch {
    return { attachUserId: null, email };
  }
}

/** Returns the rejection to send when another account already uses the phone. */
export async function rejectTakenPhone(
  ctx: SignupContext,
  attachUserId: string | null,
): Promise<Response | null> {
  const { supabase, input, eventBase } = ctx;
  // Phone uniqueness across ALL accounts (signed-in attach may reuse its own phone).
  // Searched in the database, not in a window of rows, so it holds at any scale.
  const found = await findPhoneOwners(supabase, input.phone);
  if ("error" in found) {
    await logSignupEvent(supabase, {
      ...eventBase,
      success: false,
      error_message: "phone_check_failed",
    });
    // Fail closed: a duplicate number must never slip through on a lookup error.
    return apiFail(
      "We couldn't check this phone number. Please try again.",
      503,
      "phone_check_failed",
    );
  }
  // Only the access_token attach path may reuse this user's own phone
  const phoneTaken = found.owners.find(
    (row) => !(attachUserId && row.id === attachUserId),
  );
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
  return null;
}
