import "server-only";
import { createUserProof } from "@/lib/server/otp/user-proof";

/**
 * Proof that a signed-in user just passed the identity check (password + a code
 * sent to their current email, + guarantor name when one is on file).
 *
 * Issued by POST /api/security/verify-identity and required by the sensitive
 * contact changes (new phone / new email). The server never trusts the browser
 * to say "identity was verified": it must present this signed, short-lived,
 * user-bound token. Domain-separated from every other proof.
 */
export const IDENTITY_PROOF_TTL_MS = 10 * 60 * 1000;

const proof = createUserProof("ona-identity-proof-v1", IDENTITY_PROOF_TTL_MS);

export const issueIdentityProof = proof.issue;
export const verifyIdentityProof = proof.verify;
