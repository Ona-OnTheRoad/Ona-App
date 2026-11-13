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
  /**
   * Signed proof (from /api/auth/otp/signup/verify) that `phoneProofFor`
   * received an SMS code. Not a secret and not a session: the server only
   * honours it for exactly that number, for 30 minutes.
   */
  phoneProof?: string;
  /** The canonical number the proof was issued for (e.g. +2348031234567). */
  phoneProofFor?: string;
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

/** Present only while they hold a value, so a draft without a proof keeps its original shape. */
const OPTIONAL_KEYS: (keyof SignupDraft)[] = ["phoneProof", "phoneProofFor"];

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
    for (const k of OPTIONAL_KEYS) {
      if (typeof o[k] === "string" && o[k]) draft[k] = o[k] as string;
    }
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
    for (const k of OPTIONAL_KEYS) if (draft[k]) clean[k] = draft[k] as string;
    window.sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(clean));
  } catch {
    /* storage blocked: the flow still works for this page load */
  }
}

/**
 * The proof fields to keep when the details are saved again: the proof survives
 * only while the number is unchanged, so an edited number is always re-verified.
 */
export function carriedPhoneProof(
  prev: SignupDraft | null,
  phone: string,
): { phoneProof: string; phoneProofFor: string } {
  if (prev?.phoneProof && prev.phoneProofFor && prev.phoneProofFor === phone) {
    return { phoneProof: prev.phoneProof, phoneProofFor: prev.phoneProofFor };
  }
  return { phoneProof: "", phoneProofFor: "" };
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
