import "server-only";
import { apiFail } from "@/lib/server/api-json";
import {
  consumeChangeContactCode,
  type ContactChannel,
} from "@/lib/server/otp/change-contact-otp";
import { verifyIdentityProof } from "@/lib/server/otp/identity-proof";
import type { createServiceSupabase } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceSupabase>;

/**
 * Gate for changing a phone number or email. Both must hold:
 *  1. a valid, unexpired identity proof for this user (password + email code passed), and
 *  2. the code that was sent to the exact NEW contact (consumed on success).
 *
 * Returns the response to send when the change must not go ahead, or null to proceed.
 * Call it AFTER the cheap rejections (invalid / in use / unchanged) so a user is
 * never charged a code for a change that could not have happened anyway.
 */
export async function requireContactChangeProof(
  sb: Db,
  input: {
    userId: string;
    channel: ContactChannel;
    /** Normalized new contact (see normalizeContactTarget). */
    target: string;
    code: string | undefined;
    identityProof: string | undefined;
  },
): Promise<Response | null> {
  let proofOk = false;
  try {
    proofOk = verifyIdentityProof(input.identityProof, input.userId);
  } catch {
    proofOk = false;
  }
  if (!proofOk) {
    return apiFail("Please verify your identity again.", 403, "identity_required");
  }
  if (!input.code) {
    return apiFail("Enter the code sent to your new contact.", 400, "code_required");
  }
  let check;
  try {
    check = await consumeChangeContactCode(sb, {
      userId: input.userId,
      channel: input.channel,
      target: input.target,
      code: input.code,
    });
  } catch {
    // Signing secret missing: fail closed, never apply the change.
    return apiFail("Verification is not available right now.", 503, "proof_unavailable");
  }
  if (!check.ok) return apiFail(check.message, check.status, check.code);
  return null;
}
