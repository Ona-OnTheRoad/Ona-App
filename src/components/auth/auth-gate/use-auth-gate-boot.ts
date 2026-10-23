"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath, homePathForAccount, isPublicPath } from "@/lib/routes";
import {
  resolvePostLoginDestination,
  saveReturnTo,
  sanitizeReturnTo,
} from "@/lib/auth-return-to";
import { AUTH_TRANSITION_MS } from "@/components/auth/auth-transition";
import { useApp } from "@/lib/store";
import {
  HANDOFF_MS,
  initialPhase,
  isAuthFormRoute,
  isDualRoleSignupPath,
  isWelcomeRoute,
  SPLASH_FAILSAFE_MS,
  SPLASH_MIN_MS,
  type BootPhase,
} from "./boot-routes";

/** Boot phase machine + redirects for the auth gate. */
export function useAuthGateBoot() {
  const {
    authReady,
    isAuthenticated,
    accountType,
    hasMotoristAccount,
    hasProAccount,
  } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<BootPhase>(() => initialPhase(pathname));
  const [splashExiting, setSplashExiting] = useState(false);
  /** Soft exit of Welcome before Log In / Sign Up route */
  const [entryExiting, setEntryExiting] = useState(false);
  /** Set on first splash timing effect (keep render pure). */
  const bootStartedAt = useRef<number | null>(null);
  const handoffTimer = useRef<number | null>(null);
  /** Prevents welcome effect from undoing a Log In / Sign Up navigation */
  const navigatingAwayRef = useRef(false);
  /** Once we leave splash, never re-enter loading (stops render loops) */
  const leftSplashRef = useRef(isAuthFormRoute(pathname));
  const redirectingRef = useRef(false);

  // Pathname moved to auth form → always ready (no splash bounce)
  useEffect(() => {
    if (!isAuthFormRoute(pathname)) return;
    leftSplashRef.current = true;
    if (phase !== "ready") setPhase("ready");
    setSplashExiting(false);
    setEntryExiting(false);
  }, [pathname, phase]);

  // After auth is known, hold splash briefly then hand off
  useEffect(() => {
    if (!authReady) return;
    if (phase !== "loading") return;
    if (leftSplashRef.current) {
      // Auth form path already ready; everyone else leave splash once
      if (isAuthFormRoute(pathname)) {
        setPhase("ready");
        return;
      }
      if (isAuthenticated) {
        setPhase("ready");
        return;
      }
      // Guest on welcome: go to entry, never blank "ready"
      setPhase(isWelcomeRoute(pathname) ? "entry" : "ready");
      return;
    }

    if (!isAuthenticated && isAuthFormRoute(pathname)) {
      leftSplashRef.current = true;
      setPhase("ready");
      setSplashExiting(false);
      return;
    }

    if (bootStartedAt.current == null) {
      bootStartedAt.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    }
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const elapsed = now - bootStartedAt.current;
    const wait = Math.max(0, SPLASH_MIN_MS - elapsed);

    const tmr = window.setTimeout(() => {
      leftSplashRef.current = true;
      if (isAuthenticated) {
        setSplashExiting(true);
        handoffTimer.current = window.setTimeout(() => {
          setPhase("ready");
          setSplashExiting(false);
        }, HANDOFF_MS);
        return;
      }

      // Guest: always land on welcome entry (not empty ready shell)
      setPhase("handoff");
      setSplashExiting(true);
      handoffTimer.current = window.setTimeout(() => {
        setPhase("entry");
        setSplashExiting(false);
      }, HANDOFF_MS);
    }, wait);

    return () => {
      window.clearTimeout(tmr);
      if (handoffTimer.current) window.clearTimeout(handoffTimer.current);
    };
  }, [authReady, isAuthenticated, phase, pathname]);

  // Absolute failsafe: never stay on splash forever
  useEffect(() => {
    if (phase !== "loading") return;
    const tmr = window.setTimeout(() => {
      leftSplashRef.current = true;
      setSplashExiting(false);
      if (isAuthenticated) {
        setPhase("ready");
      } else if (isAuthFormRoute(pathname)) {
        setPhase("ready");
      } else {
        setPhase("entry");
      }
    }, SPLASH_FAILSAFE_MS);
    return () => window.clearTimeout(tmr);
  }, [phase, isAuthenticated, pathname]);

  /**
   * Guest on / or /login → force welcome UI (never empty light-gray login shell).
   * Guest past welcome on forms → ready.
   */
  useEffect(() => {
    if (!authReady || isAuthenticated) return;
    if (phase === "loading" || phase === "handoff") return;
    if (navigatingAwayRef.current) return;

    if (isAuthFormRoute(pathname)) {
      leftSplashRef.current = true;
      if (phase !== "ready") setPhase("ready");
      return;
    }

    if (isWelcomeRoute(pathname)) {
      leftSplashRef.current = true;
      if (phase !== "entry") setPhase("entry");
      return;
    }

    // Other public paths (logout etc.)
    leftSplashRef.current = true;
    if (phase !== "ready") setPhase("ready");
  }, [authReady, isAuthenticated, pathname, phase]);

  const finishEntry = useCallback(
    (path: string) => {
      // One tap must open the next page (Vercel cold starts felt like double-click)
      if (navigatingAwayRef.current) return;
      navigatingAwayRef.current = true;
      leftSplashRef.current = true;
      setEntryExiting(true);
      setPhase("ready");
      // Forward returnTo if present in current query
      let targetPath = path;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const returnTo = sanitizeReturnTo(
          params.get("returnTo") || params.get("redirect"),
        );
        if (returnTo && !path.includes("returnTo=")) {
          const sep = path.includes("?") ? "&" : "?";
          targetPath = `${path}${sep}returnTo=${encodeURIComponent(returnTo)}`;
        }
      }
      // Navigate immediately fade is visual only, not a second required click
      router.replace(targetPath);
      window.setTimeout(
        () => {
          setEntryExiting(false);
          navigatingAwayRef.current = false;
        },
        Math.max(AUTH_TRANSITION_MS, 200) + 100,
      );
    },
    [router],
  );

  // Signed-in → leave login; allow dual-role signup when the other account is missing
  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    if (phase !== "ready" && phase !== "entry" && phase !== "handoff") return;
    // Promote to ready when session appears mid-splash
    if (phase !== "ready") {
      leftSplashRef.current = true;
      setPhase("ready");
      return;
    }
    if (redirectingRef.current) return;

    if (pathname.startsWith("/login")) {
      redirectingRef.current = true;
      const target = resolvePostLoginDestination(accountType);
      router.replace(target);
      window.setTimeout(() => {
        redirectingRef.current = false;
      }, 500);
      return;
    }

    if (pathname.startsWith("/signup")) {
      if (isDualRoleSignupPath(pathname, hasMotoristAccount, hasProAccount)) {
        return;
      }
      redirectingRef.current = true;
      const target = resolvePostLoginDestination(accountType);
      router.replace(target);
      window.setTimeout(() => {
        redirectingRef.current = false;
      }, 500);
    }
  }, [
    authReady,
    phase,
    isAuthenticated,
    pathname,
    accountType,
    hasMotoristAccount,
    hasProAccount,
    router,
  ]);

  // Role lock
  useEffect(() => {
    if (!authReady || phase !== "ready" || !isAuthenticated) return;
    if (redirectingRef.current) return;
    if (isPublicPath(pathname)) return;
    if (!canAccessPath(accountType, pathname)) {
      redirectingRef.current = true;
      router.replace(homePathForAccount(accountType));
      window.setTimeout(() => {
        redirectingRef.current = false;
      }, 500);
    }
  }, [authReady, phase, isAuthenticated, pathname, accountType, router]);

  // Guest on protected route → welcome + /login (never blank)
  useEffect(() => {
    if (!authReady || phase === "loading" || phase === "handoff") return;
    if (navigatingAwayRef.current || redirectingRef.current) return;
    if (isAuthenticated) return;
    if (isPublicPath(pathname) && !isWelcomeRoute(pathname)) return;
    if (!isPublicPath(pathname)) {
      leftSplashRef.current = true;
      setPhase("entry");
      if (pathname !== "/login") {
        redirectingRef.current = true;
        const fullPath =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : pathname;
        saveReturnTo(fullPath);
        router.replace(`/login?returnTo=${encodeURIComponent(fullPath)}`);
        window.setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
      }
    }
  }, [authReady, phase, isAuthenticated, pathname, router]);

  return { phase, splashExiting, entryExiting, finishEntry };
}
