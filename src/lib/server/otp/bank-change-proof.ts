import "server-only";
import { createUserProof } from "@/lib/server/otp/user-proof";

/**
 * Proof that a signed-in user just entered the code sent to the phone number on
 * their account. Issued by POST /api/security/change-bank/verify-code and required
 * to change the payout / refund bank account. Domain-separated from identity and
 * signup proofs.
 */
export const BANK_CHANGE_PROOF_TTL_MS = 10 * 60 * 1000;

const proof = createUserProof("ona-bank-change-proof-v1", BANK_CHANGE_PROOF_TTL_MS);

export const issueBankChangeProof = proof.issue;
export const verifyBankChangeProof = proof.verify;
