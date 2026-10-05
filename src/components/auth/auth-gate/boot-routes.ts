/** Brief branded splash (photo + Loading Ona) before Welcome / app */
export const SPLASH_MIN_MS = 120;
/** Soft crossfade splash → Welcome */
export const HANDOFF_MS = 100;
/** Absolute max splash long enough for session restore to win over guest flash */
export const SPLASH_FAILSAFE_MS = 2800;

/** Exact welcome routes only not /login/signin or /login/role */
export function isWelcomeRoute(pathname: string) {
  return pathname === "/login" || pathname === "/";
}

/** Auth forms should skip brand splash once session is known */
export function isAuthFormRoute(pathname: string) {
  if (pathname.startsWith("/login/signin")) return true;
  if (pathname.startsWith("/login/role")) return true;
  if (pathname.startsWith("/login/reset-password")) return true;
  if (pathname.startsWith("/login/pro-service")) return true;
  if (pathname.startsWith("/signup")) return true;
  return false;
}

export type BootPhase = "loading" | "handoff" | "entry" | "ready";

export function isDualRoleSignupPath(
  pathname: string,
  hasMotoristAccount: boolean,
  hasProAccount: boolean,
): boolean {
  if (pathname.startsWith("/signup/error")) return true;

  if (
    typeof window !== "undefined" &&
    (pathname.startsWith("/signup/motorist") ||
      pathname.startsWith("/signup/pro"))
  ) {
    try {
      const from = new URLSearchParams(window.location.search).get("from");
      if (from === "menu" || from === "profile") return true;
    } catch {
      /* ignore */
    }
  }

  if (pathname.startsWith("/signup/motorist") && !hasMotoristAccount) {
    return true;
  }
  if (pathname.startsWith("/signup/pro") && !hasProAccount) {
    return true;
  }
  return false;
}

export function initialPhase(pathname: string): BootPhase {
  // Deep-link into forms: never trap on splash
  if (isAuthFormRoute(pathname)) return "ready";
  return "loading";
}
