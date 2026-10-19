/**
 * Shared "Create account" details collected once at /signup and reused by the
 * Customer and Repair Pro wizards. Lives in sessionStorage only; NEVER holds a
 * password. Every access is try/catch'd and SSR-safe.
 */
import type { SignupGender } from "@/lib/signup-validation";

export const SIGNUP_DRAFT_KEY = "ona-signup-draft";

export type SignupDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phoneIso: string;
  phoneDial: string;
  phoneNational: string;
  gender: SignupGender | "";
  dateOfBirth: string;
  referral: string;
  idNumber: string;
  bvn: string;
};

const STRING_KEYS: (keyof SignupDraft)[] = [
  "firstName",
  "lastName",
  "email",
  "phoneIso",
  "phoneDial",
  "phoneNational",
  "gender",
  "dateOfBirth",
  "referral",
  "idNumber",
  "bvn",
];

export function loadSignupDraft(): SignupDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== "object") return null;
    const draft = {} as Record<string, string>;
    for (const k of STRING_KEYS)
      draft[k] = typeof o[k] === "string" ? (o[k] as string) : "";
    return draft as unknown as SignupDraft;
  } catch {
    return null;
  }
}

export function saveSignupDraft(draft: SignupDraft): void {
  if (typeof window === "undefined") return;
  try {
    const clean: Record<string, string> = {};
    for (const k of STRING_KEYS) clean[k] = draft[k] ?? "";
    window.sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(clean));
  } catch {
    /* storage blocked: the flow still works for this page load */
  }
}

export function clearSignupDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Keeps `?ref=` (and an optional error text) on every signup hop. */
export function signupHref(
  path: string,
  opts: { ref?: string | null; err?: string | null } = {},
): string {
  const q = new URLSearchParams();
  if (opts.ref) q.set("ref", opts.ref);
  if (opts.err) q.set("err", opts.err);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
