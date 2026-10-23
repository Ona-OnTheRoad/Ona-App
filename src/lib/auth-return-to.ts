import type { AccountType } from "@/lib/types";
import { canAccessPath, homePathForAccount, isPublicPath } from "@/lib/routes";

export const RETURN_TO_STORAGE_KEY = "ona-return-to";

/**
 * Validates and sanitizes a returnTo path to prevent open redirects, XSS and loops.
 * Must be a local relative path starting with a single '/' and not an auth/public route.
 */
export function sanitizeReturnTo(
  raw: string | null | undefined,
  accountType?: AccountType | null,
): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Prevent protocol-relative URLs (//example.com) and backslash traversal (/\example.com)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return null;
  }

  // Prevent scheme protocols (javascript:, data:, https:, http:, etc.)
  if (/^(\/|\\)*[a-z0-9+.-]+:/i.test(trimmed)) {
    return null;
  }

  // Extract path portion (without query/hash) to verify route permissions
  const pathOnly = trimmed.split("?")[0].split("#")[0];

  // Must not loop back to auth pages (login, signup, logout)
  if (isPublicPath(pathOnly)) {
    return null;
  }

  // If user role is provided, verify they are allowed to access this route
  if (accountType && !canAccessPath(accountType, pathOnly)) {
    return null;
  }

  return trimmed;
}

/**
 * Saves the intended return path into sessionStorage.
 */
export function saveReturnTo(path: string | null | undefined): void {
  const sanitized = sanitizeReturnTo(path);
  if (!sanitized) return;
  try {
    sessionStorage.setItem(RETURN_TO_STORAGE_KEY, sanitized);
  } catch {
    /* private mode / quota */
  }
}

/**
 * Retrieves the returnTo path, checking URL search parameter first, then sessionStorage.
 * Clears sessionStorage after reading so stale return destinations are not reused.
 */
export function getAndClearReturnTo(
  accountType?: AccountType | null,
  searchParam?: string | null,
): string | null {
  let candidate: string | null = null;

  // 1. Check explicit search param (e.g. ?returnTo=...)
  if (searchParam) {
    candidate = sanitizeReturnTo(searchParam, accountType);
  }

  // 2. Check window.location.search if running in browser
  if (!candidate && typeof window !== "undefined") {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramVal = urlParams.get("returnTo") || urlParams.get("redirect");
      if (paramVal) {
        candidate = sanitizeReturnTo(paramVal, accountType);
      }
    } catch {
      /* ignore */
    }
  }

  // 3. Check sessionStorage
  if (!candidate && typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(RETURN_TO_STORAGE_KEY);
      if (stored) {
        candidate = sanitizeReturnTo(stored, accountType);
      }
    } catch {
      /* ignore */
    }
  }

  // Always clean up sessionStorage
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return candidate;
}

/**
 * Resolves the destination after login: returns the sanitized returnTo path
 * or defaults to the role's home path.
 */
export function resolvePostLoginDestination(
  accountType: AccountType | null,
  searchParam?: string | null,
): string {
  const returnTo = getAndClearReturnTo(accountType, searchParam);
  return returnTo || homePathForAccount(accountType);
}
