import "server-only";
export { createContactChangeRequest } from "@/lib/server/security/security-store";
export { getContactChangeRequest } from "@/lib/server/security/security-store";
export { listContactChangeRequests } from "@/lib/server/security/security-store";
export { updateContactChangeStatus } from "@/lib/server/security/security-store";
export { verifyContactChangeCode } from "@/lib/server/security/security-store";

import type { ContactChangeRequest } from "@/lib/security/types";

/**
 * Verification codes must never leave the server: whoever reads one can complete
 * the change. Apply this to every contact-change request returned over HTTP.
 */
export function redactContactRequest(r: ContactChangeRequest): ContactChangeRequest {
  return { ...r, oldCode: undefined, newCode: undefined };
}
