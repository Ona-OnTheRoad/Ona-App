import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/env";
import { normalizeContactTarget } from "@/lib/server/otp/change-contact-otp";
import { markUserPhoneVerified } from "@/lib/server/otp/mark-phone-verified";
import { findPhoneOwners, phoneTail } from "@/lib/server/otp/phone-owners";
import { requireContactChangeProof } from "@/lib/server/security/contact-change-guard";
import { verifyBankChangeProof } from "@/lib/server/otp/bank-change-proof";
import { isBankAccountTaken } from "@/lib/server/payments/bank-lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum([
    "change_phone",
    "change_email",
    "change_password",
    "change_bank",
    "request_name_change",
  ]),
  accessToken: z.string().min(10),
  newValue: z.string().optional(),
  confirmValue: z.string().optional(),
  currentPassword: z.string().optional(),
  reason: z.string().optional(),
  identityDocumentUrl: z.string().optional(),
  identityDocumentType: z.string().optional(),
  /** change_phone / change_email: code sent to the NEW contact. */
  code: z.string().min(4).max(8).optional(),
  /** change_phone / change_email: proof from POST /api/security/verify-identity. */
  identityProof: z.string().max(600).optional(),
  /** change_bank: proof from POST /api/security/change-bank/verify-code. */
  bankProof: z.string().max(600).optional(),
});

/** Escape LIKE wildcards so an email like "a_b@x.com" only matches itself. */
function likeExact(v: string): string {
  return v.replace(/[\\%_]/g, "\\$&");
}

function maskValue(
  val: string,
  type: "phone" | "email" | "bank" | "other",
): string {
  if (type === "phone" && val.length >= 8) {
    return val.slice(0, 5) + "***" + val.slice(-3);
  }
  if (type === "email") {
    const [name, domain] = val.split("@");
    if (name && domain) return name.slice(0, 2) + "***@" + domain;
  }
  if (type === "bank") return "****" + val.slice(-4);
  return val.length > 4 ? val.slice(0, 2) + "***" + val.slice(-1) : "***";
}

async function getUserIdFromToken(accessToken: string): Promise<string | null> {
  try {
    const supabase = createServiceSupabase();
    const { data } = await supabase.auth.getUser(accessToken);
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function writeAuditLog(params: {
  userId: string;
  actionType: string;
  riskTier: "sensitive" | "critical";
  status: "completed" | "failed";
  oldValue?: string;
  newValue?: string;
  maskedOldValue?: string;
  maskedNewValue?: string;
  verificationMethod?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = createServiceSupabase();
    await supabase.from("profile_audit_log").insert({
      user_id: params.userId,
      action_type: params.actionType,
      risk_tier: params.riskTier,
      status: params.status,
      old_value: params.oldValue,
      new_value: params.newValue,
      masked_old_value: params.maskedOldValue,
      masked_new_value: params.maskedNewValue,
      verification_method: params.verificationMethod,
      error_message: params.errorMessage,
      metadata: params.metadata || {},
    });
  } catch {
    /* non-fatal */
  }
}

async function notifyUser(
  userId: string,
  title: string,
  body: string,
  type: string,
) {
  try {
    const { insertNotification } = await import("@/lib/server/notifications");
    await insertNotification({
      userId,
      category: "system",
      priority: "high",
      title,
      body,
      href: "/settings/security",
      actionType: "open_job",
      actionPayload: {},
      groupKey: `security-${type}-${userId}-${Date.now()}`,
    });
  } catch {
    /* non-fatal */
  }
}

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password))
    return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain a number.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain a special character.";
  return null;
}

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

  const parsed = actionSchema.safeParse(json);
  if (!parsed.success) {
    return apiFail(parsed.error.issues[0]?.message || "Invalid request", 400);
  }

  const {
    action,
    accessToken,
    newValue,
    currentPassword,
    reason,
    identityDocumentUrl,
    identityDocumentType,
  } = parsed.data;

  const userId = await getUserIdFromToken(accessToken);
  if (!userId) return apiFail("Invalid session", 401);

  const supabase = createServiceSupabase();
  const now = new Date().toISOString();

  switch (action) {
    // ── CHANGE PHONE ──────────────────────────────────────────────────────────
    case "change_phone": {
      if (!newValue) return apiFail("New phone number is required", 400);
      const phone = normalizeContactTarget("phone", newValue);
      if (!phone) return apiFail("Invalid phone number", 400);

      // Get current phone
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .single();

      const oldPhone = (profile as { phone?: string } | null)?.phone || "";
      if (phoneTail(oldPhone) !== null && phoneTail(oldPhone) === phoneTail(phone)) {
        return apiFail("That is already your phone number.", 400, "same_as_current");
      }

      // Already used by another account: same last-10-digits rule as signup, fail closed.
      const found = await findPhoneOwners(supabase, phone);
      if ("error" in found) {
        return apiFail("Could not check this number. Try again.", 503, "lookup_failed");
      }
      if (found.owners.some((o) => o.id !== userId)) {
        return apiFail("This phone number is already in use.", 409, "in_use");
      }

      // Identity proof + the code sent to this exact new number.
      const blocked = await requireContactChangeProof(supabase, {
        userId,
        channel: "phone",
        target: phone,
        code: parsed.data.code,
        identityProof: parsed.data.identityProof,
      });
      if (blocked) return blocked;

      // Update profiles table
      await supabase
        .from("profiles")
        .update({ phone, updated_at: now })
        .eq("id", userId);

      // Update role-specific tables
      await supabase
        .from("motorist_profiles")
        .update({ phone, updated_at: now })
        .eq("user_id", userId);
      await supabase
        .from("repair_pro_profiles")
        .update({ phone, updated_at: now })
        .eq("user_id", userId);

      // The new number just received and confirmed a code: it is verified.
      try {
        await markUserPhoneVerified(supabase, userId);
      } catch {
        /* optional columns; the change itself already succeeded */
      }

      await writeAuditLog({
        userId,
        actionType: "change_phone",
        riskTier: "sensitive",
        status: "completed",
        oldValue: oldPhone,
        newValue: phone,
        maskedOldValue: maskValue(oldPhone, "phone"),
        maskedNewValue: maskValue(phone, "phone"),
        verificationMethod: "otp_phone",
      });

      await notifyUser(
        userId,
        "Phone number updated",
        "Your phone number has been changed. If you did not make this change, secure your account immediately.",
        "phone_changed",
      );

      return apiOk({ updated: true, maskedValue: maskValue(phone, "phone") });
    }

    // ── CHANGE EMAIL ──────────────────────────────────────────────────────────
    case "change_email": {
      if (!newValue) return apiFail("New email address is required", 400);
      const email = normalizeContactTarget("email", newValue);
      if (!email) return apiFail("Invalid email address", 400);

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();
      const oldEmail = (profile as { email?: string } | null)?.email || "";
      if (oldEmail.trim().toLowerCase() === email) {
        return apiFail("That is already your email address.", 400, "same_as_current");
      }

      // Check not in use by another account
      const { data: existingEmail, error: emailLookupErr } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", likeExact(email))
        .limit(5);
      if (emailLookupErr) {
        return apiFail("Could not check this email. Try again.", 503, "lookup_failed");
      }
      if ((existingEmail || []).some((r) => (r as { id: string }).id !== userId)) {
        return apiFail("This email is already in use.", 409, "in_use");
      }

      // Identity proof + the code sent to this exact new email.
      const blocked = await requireContactChangeProof(supabase, {
        userId,
        channel: "email",
        target: email,
        code: parsed.data.code,
        identityProof: parsed.data.identityProof,
      });
      if (blocked) return blocked;

      // Update email in profiles table
      await supabase
        .from("profiles")
        .update({ email, updated_at: now })
        .eq("id", userId);

      // Attempt to update Supabase Auth email
      try {
        await supabase.auth.admin.updateUserById(userId, { email });
      } catch {
        /* auth email update is best-effort; profile email is the source of truth */
      }

      await writeAuditLog({
        userId,
        actionType: "change_email",
        riskTier: "sensitive",
        status: "completed",
        oldValue: oldEmail,
        newValue: email,
        maskedOldValue: maskValue(oldEmail, "email"),
        maskedNewValue: maskValue(email, "email"),
        verificationMethod: "otp_email",
      });

      await notifyUser(
        userId,
        "Email address updated",
        "Your email address has been changed. If you did not make this change, secure your account immediately.",
        "email_changed",
      );

      // TODO: send email notification to oldEmail when email provider is wired

      return apiOk({ updated: true, maskedValue: maskValue(email, "email") });
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────────────────────
    case "change_password": {
      if (!newValue || !parsed.data.confirmValue) {
        return apiFail("New password and confirmation are required", 400);
      }
      if (newValue !== parsed.data.confirmValue) {
        return apiFail("Passwords do not match", 400);
      }

      const pwErr = validatePasswordStrength(newValue);
      if (pwErr) return apiFail(pwErr, 400);

      // Verify current password
      if (!currentPassword) return apiFail("Current password is required", 400);

      // Get user email for re-auth
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email;
      if (!userEmail) return apiFail("Could not identify user", 500);

      // Verify password on a throwaway anon client so the service client
      // never holds a user session or drops its service_role privileges.
      const authClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: authErr } = await authClient.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (authErr) return apiFail("Current password is incorrect", 403);

      // Update password via admin API
      const { error: updateErr } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: newValue,
        },
      );
      if (updateErr) return apiFail(updateErr.message, 500);

      await writeAuditLog({
        userId,
        actionType: "change_password",
        riskTier: "sensitive",
        status: "completed",
        verificationMethod: "password",
      });

      await notifyUser(
        userId,
        "Password changed",
        "Your password has been updated. If you did not make this change, secure your account immediately.",
        "password_changed",
      );

      return apiOk({ updated: true });
    }

    // ── CHANGE BANK ───────────────────────────────────────────────────────────
    case "change_bank": {
      if (!newValue) return apiFail("Bank details are required", 400);

      // Redirecting payouts and refunds is the most sensitive change an account can
      // make: it needs the code that was just sent to the phone on the account.
      let proofOk = false;
      try {
        proofOk = verifyBankChangeProof(parsed.data.bankProof, userId);
      } catch {
        proofOk = false;
      }
      if (!proofOk) {
        return apiFail(
          "Please verify with the code sent to your phone.",
          403,
          "verification_required",
        );
      }

      let bankData: {
        bankName?: string;
        bankAccountName?: string;
        bankAccountNumber?: string;
        bankCode?: string;
      };
      try {
        bankData =
          typeof newValue === "string" ? JSON.parse(newValue) : newValue;
      } catch {
        return apiFail("Invalid bank data format", 400);
      }
      if (
        !bankData ||
        typeof bankData !== "object" ||
        !bankData.bankName ||
        !bankData.bankAccountName ||
        !bankData.bankAccountNumber ||
        !bankData.bankCode
      ) {
        return apiFail(
          "All bank fields are required: bankName, bankAccountName, bankAccountNumber, bankCode",
          400,
        );
      }
      bankData = {
        bankName: String(bankData.bankName).trim().slice(0, 80),
        bankAccountName: String(bankData.bankAccountName).trim().slice(0, 120),
        bankAccountNumber: String(bankData.bankAccountNumber).replace(/\D/g, ""),
        bankCode: String(bankData.bankCode).trim().slice(0, 20),
      };
      if (bankData.bankAccountNumber!.length !== 10) {
        return apiFail("Account number must be 10 digits.", 400, "validation");
      }
      if (!bankData.bankName || !bankData.bankAccountName || !bankData.bankCode) {
        return apiFail("All bank fields are required.", 400, "validation");
      }

      // One bank account (code + NUBAN) may only belong to one Ona user.
      if (
        await isBankAccountTaken({
          accountNumber: bankData.bankAccountNumber!,
          bankCode: bankData.bankCode!,
          excludeUserId: userId,
        })
      ) {
        return apiFail(
          "This bank account is already used on another Ona account. Use a different one.",
          409,
          "bank_account_in_use",
        );
      }

      const { data: currentBank } = await supabase
        .from("repair_pro_profiles")
        .select("bank_name, bank_account_name, bank_account_number, bank_code")
        .eq("user_id", userId)
        .single();
      const oldBank = currentBank as Record<string, unknown> | null;

      const updateData: Record<string, unknown> = {
        bank_name: bankData.bankName,
        bank_account_name: bankData.bankAccountName,
        bank_account_number: bankData.bankAccountNumber,
        bank_code: bankData.bankCode,
        updated_at: now,
      };

      // Do not report success if the write did not happen.
      const proWrite = await supabase
        .from("repair_pro_profiles")
        .update(updateData)
        .eq("user_id", userId);
      const motWrite = await supabase
        .from("motorist_profiles")
        .update(updateData)
        .eq("user_id", userId);
      if (proWrite.error || motWrite.error) {
        await writeAuditLog({
          userId,
          actionType: "change_bank",
          riskTier: "critical",
          status: "failed",
          errorMessage: (proWrite.error || motWrite.error)?.message,
          verificationMethod: "otp_phone",
        });
        return apiFail("Could not update your bank account. Please try again.", 500, "update_failed");
      }

      await writeAuditLog({
        userId,
        actionType: "change_bank",
        riskTier: "critical",
        status: "completed",
        oldValue: JSON.stringify(oldBank || {}),
        newValue: JSON.stringify(bankData),
        maskedOldValue: maskValue(
          (oldBank?.bank_account_number as string) || "",
          "bank",
        ),
        maskedNewValue: maskValue(bankData.bankAccountNumber ?? "", "bank"),
        verificationMethod: "otp_phone",
      });

      await notifyUser(
        userId,
        "Bank account updated",
        "Your payout bank account has been changed. If you did not make this change, contact support immediately.",
        "bank_changed",
      );

      return apiOk({ updated: true });
    }

    // ── REQUEST NAME CHANGE ───────────────────────────────────────────────────
    case "request_name_change": {
      if (!newValue) return apiFail("Requested name is required", 400);
      const requestedName = newValue.trim();
      if (requestedName.length < 2)
        return apiFail("Name must be at least 2 characters", 400);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      const currentName =
        (profile as { full_name?: string } | null)?.full_name || "";

      const { error: insertErr } = await supabase
        .from("name_change_requests")
        .insert({
          user_id: userId,
          current_name: currentName,
          requested_name: requestedName,
          reason: reason || null,
          identity_document_url: identityDocumentUrl || null,
          identity_document_type: identityDocumentType || null,
          status: "pending",
        });
      if (insertErr) return apiFail(insertErr.message, 500);

      await writeAuditLog({
        userId,
        actionType: "request_name_change",
        riskTier: "critical",
        status: "completed",
        oldValue: currentName,
        newValue: requestedName,
        maskedOldValue: maskValue(currentName, "other"),
        maskedNewValue: maskValue(requestedName, "other"),
        verificationMethod: "admin_review",
      });

      await notifyUser(
        userId,
        "Name change requested",
        "Your request to change your name has been submitted for review. We will notify you once it is processed.",
        "name_change_requested",
      );

      return apiOk({ submitted: true });
    }

    default:
      return apiFail("Unknown action", 400);
  }
}
