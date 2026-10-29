import { useCallback, useEffect } from "react";
import { getArtisanProfile } from "@/lib/artisan/local-store";
import {
  isCustomerToProDualPath,
  isProSwitchMandatoryOnboardingDone,
  writeProOnboardingSheetFlag,
} from "@/lib/pro-switch-onboarding";
import { DEVICE_THEME_KEY } from "./constants";
import { systemTheme, themeKeyForUser } from "./storage";
import type { AppTheme } from "./types";
import type { SessionStateResult } from "./use-session-state";

export function useThemeAndProSheet(session: SessionStateResult) {
  const {
    theme,
    setThemeState,
    themeReady,
    isAuthenticated,
    accountType,
    primaryAccountType,
    userProfile,
    hasMotoristAccount,
    hasProAccount,
    setProOnboardingSheetRequiredState,
    backendUserId,
  } = session;

  // Keep html[data-theme] + html.dark + page stage in sync so full app flips light↔dark
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    // Explicit stage so body/html match phone shell outer (opposite themes)
    const stage = theme === "light" ? "#060d0a" : "#000000";
    root.style.backgroundColor = stage;
    if (document.body) document.body.style.backgroundColor = stage;
  }, [theme]);

  /**
   * Rehydrate C→Pro mandatory bottom sheet after refresh/relogin.
   * Session flag alone was lost on reload; Settings Verification stays hidden
   * until T2, so without this dual Pros could get stuck.
   */
  useEffect(() => {
    if (!isAuthenticated || accountType !== "professional") {
      return;
    }
    const dual = isCustomerToProDualPath({
      hasMotoristAccount,
      hasProAccount,
      accountType,
      primaryAccountType,
    });
    if (!dual) return;
    const artisan = backendUserId ? getArtisanProfile(backendUserId) : null;
    // Dual incomplete: keep sheet available (pill); auto-expand throttled to 30m
    const incomplete = !isProSwitchMandatoryOnboardingDone(
      userProfile,
      artisan,
    );
    if (!incomplete) {
      setProOnboardingSheetRequiredState(false);
      writeProOnboardingSheetFlag(backendUserId, false);
      return;
    }
    setProOnboardingSheetRequiredState(true);
    writeProOnboardingSheetFlag(backendUserId, true);
  }, [
    isAuthenticated,
    accountType,
    hasMotoristAccount,
    hasProAccount,
    primaryAccountType,
    backendUserId,
    userProfile,
    setProOnboardingSheetRequiredState,
  ]);

  // Follow OS theme only when no device/account override is stored
  useEffect(() => {
    if (!themeReady) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      try {
        const uid = backendUserId;
        const key = themeKeyForUser(uid);
        const saved = localStorage.getItem(key);
        if (saved === "light" || saved === "dark") return;
        if (localStorage.getItem(DEVICE_THEME_KEY)) return;
      } catch {
        /* ignore */
      }
      setThemeState(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themeReady, backendUserId, setThemeState]);

  /** Persist theme per logged-in account (+ device fallback). */
  const persistTheme = useCallback(
    (t: AppTheme, userId?: string | null) => {
      const uid = userId !== undefined ? userId : backendUserId;
      try {
        localStorage.setItem(DEVICE_THEME_KEY, t);
        if (uid) localStorage.setItem(themeKeyForUser(uid), t);
      } catch {
        /* ignore */
      }
    },
    [backendUserId],
  );

  const applyAccountTheme = useCallback(
    (userId: string | null | undefined) => {
      try {
        if (userId) {
          const personal = localStorage.getItem(
            themeKeyForUser(userId),
          ) as AppTheme | null;
          if (personal === "light" || personal === "dark") {
            setThemeState(personal);
            return;
          }
        }
        const device = localStorage.getItem(
          DEVICE_THEME_KEY,
        ) as AppTheme | null;
        if (device === "light" || device === "dark") {
          setThemeState(device);
          return;
        }
        setThemeState(systemTheme());
      } catch {
        setThemeState(systemTheme());
      }
    },
    [setThemeState],
  );

  const setTheme = useCallback(
    (t: AppTheme) => {
      setThemeState(t);
      persistTheme(t);
    },
    [persistTheme, setThemeState],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((t) => {
      const next = t === "light" ? "dark" : "light";
      persistTheme(next);
      return next;
    });
  }, [persistTheme, setThemeState]);
  return {
    persistTheme,
    applyAccountTheme,
    setTheme,
    toggleTheme,
  };
}

export type ThemeAndProSheetResult = ReturnType<typeof useThemeAndProSheet>;
