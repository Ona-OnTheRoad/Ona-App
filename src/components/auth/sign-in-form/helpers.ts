/** How the user logs in: SMS code to a phone, or email + password. */
export type LoginMethod = "phone" | "email";

/** Live countdown only after 4 failed OTP attempts */
export const FAIL_THRESHOLD = 4;
export const COOLDOWN_SEC = 45;

/** Never surface demo codes or SMS-config internals in the UI */
export function publicMessage(
  raw?: string,
  fallback = "Something went wrong.",
) {
  if (!raw) return fallback;
  const s = raw
    .replace(/SMS not configured[^.]*\.?/gi, "")
    .replace(/SMS not sent[^.]*\.?/gi, "")
    .replace(/\s*demo code\s*\d+/gi, "")
    .replace(/\s*or use demo\s*\d+/gi, "")
    .replace(/\b336699\b/g, "")
    .replace(/Use demo code[^.]*\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
  if (!s || /demo/i.test(s) || /not configured/i.test(s)) return fallback;
  return s;
}

const LAST_ROLE_KEY = "ona-last-login-role";

/** Role used for the last successful login on this device (survives logout). */
export function readLastLoginRole(): "motorist" | "professional" | null {
  try {
    const v = localStorage.getItem(LAST_ROLE_KEY);
    return v === "motorist" || v === "professional" ? v : null;
  } catch {
    return null;
  }
}

export function writeLastLoginRole(role: "motorist" | "professional"): void {
  try {
    localStorage.setItem(LAST_ROLE_KEY, role);
  } catch {
    /* private mode: the default still works */
  }
}
