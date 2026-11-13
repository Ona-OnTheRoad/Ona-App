import "server-only";
import { apiFail } from "@/lib/server/api-json";
import type { SignupContext } from "@/lib/server/signup/context";
import {
  friendlyAuthError,
  logSignupEvent,
  passwordClient,
} from "@/lib/server/signup/helpers";
import { passwordError } from "@/lib/signup-validation";

/** Returns the account to write to, or the rejection to send. */
export async function createOrAttachUser(
  ctx: SignupContext,
  attachUserId: string | null,
): Promise<{ userId: string; createdNew: boolean } | Response> {
  const { supabase, input, email, role, eventBase } = ctx;
  // 1) Create auth user OR attach the other role on the signed-in identity.
  // Unsigned signup never recovers/logs in an existing email (no profile overwrite).
  let userId: string | null = null;
  let createdNew = false;

  if (attachUserId) {
    // Sole dual-role route: reuse this user id; verify password owns the account
    const signed = await (await passwordClient()).auth.signInWithPassword({
      email:
        (
          await supabase.auth.admin.getUserById(attachUserId)
        ).data.user?.email?.toLowerCase() || email,
      password: input.password,
    });
    if (signed.error || !signed.data.user) {
      return apiFail(
        "Enter the password for your existing Ona account to add this role.",
        401,
        "password_required",
      );
    }
    if (signed.data.user.id !== attachUserId) {
      return apiFail(
        "Password belongs to a different account. Stay signed in and try again.",
        403,
        "identity_mismatch",
      );
    }
    const sideTable =
      role === "motorist" ? "motorist_profiles" : "repair_pro_profiles";
    const { data: existingSide } = await supabase
      .from(sideTable)
      .select("user_id")
      .eq("user_id", attachUserId)
      .maybeSingle();
    if (existingSide) {
      await logSignupEvent(supabase, {
        ...eventBase,
        success: false,
        error_message: "role_exists",
        user_id: attachUserId,
      });
      return apiFail(
        role === "motorist"
          ? "This account already has a Customer role. Log in instead."
          : "This account already has a Repair Pro role. Log in instead.",
        409,
        "role_exists",
      );
    }
    userId = attachUserId;
    createdNew = false;
  } else {
    // New accounts must meet the password policy (dual-role attach reuses the existing one).
    const weak = passwordError(input.password);
    if (weak) return apiFail(weak, 400, "weak_password");
    const created = await supabase.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: input.fullName,
        phone: input.phone,
        gender: input.gender,
        date_of_birth: input.dateOfBirth,
      },
    });

    if (created.error || !created.data.user) {
      const msg = created.error?.message || "Could not create account";
      const lower = msg.toLowerCase();
      const exists =
        lower.includes("already") ||
        lower.includes("registered") ||
        lower.includes("exists") ||
        created.error?.status === 422;

      if (!exists) {
        const f = friendlyAuthError(msg);
        await logSignupEvent(supabase, {
          ...eventBase,
          success: false,
          error_message: f.message,
        });
        return apiFail(f.message, f.status, f.code);
      }

      const m =
        "An account with this email already exists. Log in with your password, or reset it if you forgot.";
      await logSignupEvent(supabase, {
        ...eventBase,
        success: false,
        error_message: m,
      });
      return apiFail(m, 409, "email_exists");
    }
    userId = created.data.user.id;
    createdNew = true;
  }

  if (!userId) {
    await logSignupEvent(supabase, {
      ...eventBase,
      success: false,
      error_message: "Signup failed no user id returned.",
    });
    return apiFail("Signup failed no user id returned.", 500);
  }

  return { userId, createdNew };
}

/** Writes the base `profiles` row. Returns the failure to send, or null. */
export async function upsertBaseProfile(
  ctx: SignupContext,
  userId: string,
): Promise<Response | null> {
  const { supabase, input, email, role, eventBase } = ctx;
  // 2) Enrich profile (service role bypasses RLS; trigger may have inserted stub)
  // Dual accounts: do not wipe the other role only set active role to the one signing up
  // Always force is_active true on signup / dual-role add (never inherit a frozen flag)
  const { error: profileErr } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: input.fullName,
      phone: input.phone || null,
      email,
      city: input.city || null,
      area: input.area || null,
      avatar_url: input.avatarUrl || null,
      gender: input.gender,
      date_of_birth: input.dateOfBirth,
      role,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileErr) {
    // Retry without gender/DOB if columns not migrated yet
    if (
      /gender|date_of_birth/i.test(profileErr.message) ||
      profileErr.message.includes("does not exist")
    ) {
      const { error: e2 } = await supabase.from("profiles").upsert(
        {
          id: userId,
          full_name: input.fullName,
          phone: input.phone || null,
          email,
          city: input.city || null,
          area: input.area || null,
          avatar_url: input.avatarUrl || null,
          role,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (e2) {
        await logSignupEvent(supabase, {
          ...eventBase,
          success: false,
          error_message: e2.message,
          user_id: userId,
          meta: { stage: "profile" },
        });
        return apiFail(
          `Account saved but profile failed: ${e2.message}`,
          500,
          "profile_error",
        );
      }
    } else {
      await logSignupEvent(supabase, {
        ...eventBase,
        success: false,
        error_message: profileErr.message,
        user_id: userId,
        meta: { stage: "profile" },
      });
      return apiFail(
        `Account saved but profile failed: ${profileErr.message}`,
        500,
        "profile_error",
      );
    }
  }
  return null;
}
