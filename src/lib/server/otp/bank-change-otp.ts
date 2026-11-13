import "server-only";

/**
 * phone_otps.phone value for bank-change codes: bound to the user AND the phone the
 * code was sent to, in its own namespace ("bank:"), so it can never satisfy a login,
 * signup or contact-change code, nor a code for another user.
 */
export function bankChangeKey(userId: string, phone: string): string {
  return `bank:${userId}:${phone}`;
}
