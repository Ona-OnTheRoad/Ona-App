import { useEffect } from "react";
import { isProService } from "@/lib/pro-service-id";
import { readProfilesVault } from "@/lib/profiles-vault";
import {
  backendDualRoleFlags,
  backendGetSessionUserId,
  backendLoadUserProfile,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type {
  AccountType,
  ProService,
  RegisteredAs,
  UserProfile,
} from "@/lib/types";
import {
  AUTH_KEY,
  DEVICE_THEME_KEY,
  MODE_KEY,
  PROFILE_KEY,
  ROLE_KEY,
  SERVICES_KEY,
} from "./constants";
import { isRegisteredAs, systemTheme } from "./storage";
import type { AppTheme } from "./types";
import type { SessionStateResult } from "./use-session-state";

export function useBootSession(session: SessionStateResult) {
  const {
    setThemeState,
    setThemeReady,
    setRoleReady,
    setAuthReady,
    setRegisteredAsState,
    setUserModeState,
    setProServicesState,
    setHasMotoristAccount,
    setHasProAccount,
    applySessionRef,
    applyAccountThemeRef,
    setBackendUserId,
    setServerSessionReady,
    clearLocalAuth,
  } = session;

  // Initial: device theme until account session applies personal theme
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEVICE_THEME_KEY) as AppTheme | null;
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
      } else {
        setThemeState(systemTheme());
      }
    } catch {
      setThemeState(systemTheme());
    }
    setThemeReady(true);
  }, [setThemeReady, setThemeState]);

  // Hydrate role prefs from localStorage, then REQUIRE Supabase session for auth
  useEffect(() => {
    let cancelled = false;
    try {
      const rawRole = localStorage.getItem(ROLE_KEY);
      const role: RegisteredAs = isRegisteredAs(rawRole) ? rawRole : "client";
      setRegisteredAsState(role);

      let services: ProService[] = [];
      const rawServices = localStorage.getItem(SERVICES_KEY);
      if (rawServices) {
        try {
          const parsed = JSON.parse(rawServices) as unknown;
          if (Array.isArray(parsed)) {
            services = parsed.filter(isProService);
          }
        } catch {
          /* ignore */
        }
      }
      if (isProService(role) && !services.includes(role)) {
        services = [role, ...services];
      }
      setProServicesState(services);

      const rawMode = localStorage.getItem(MODE_KEY);
      if (rawMode === "client" || rawMode === "professional") {
        setUserModeState(rawMode);
      } else {
        setUserModeState(role === "client" ? "client" : "professional");
      }

      // Vault flags only (do NOT grant homepage access from local auth flag)
      const vault = readProfilesVault();
      setHasMotoristAccount(Boolean(vault.motorist));
      setHasProAccount(Boolean(vault.professional));
    } catch {
      setRegisteredAsState("client");
      setUserModeState("client");
      setProServicesState([]);
    }

    setRoleReady(true);

    // First paint straight from the last session we trust on this device
    // no network round trip required. The splash hands off after ~120ms for
    // everyone (signed-in AND guest); the server state is then verified in the
    // background and simply re-applied when it resolves. Only clear auth when
    // there is genuinely no local session (it can NEVER be a network-latency
    // artefact, since getSession() reads persisted state, not the network).
    const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
      new Promise((resolve, reject) => {
        const t = window.setTimeout(
          () => reject(new Error("session_timeout")),
          ms,
        );
        p.then(
          (v) => {
            window.clearTimeout(t);
            resolve(v);
          },
          (e) => {
            window.clearTimeout(t);
            reject(e);
          },
        );
      });

    /** Local session we can safely paint with (last saved profile). */
    const readStoredSessionProfile = (): UserProfile | null => {
      try {
        if (localStorage.getItem(AUTH_KEY) !== "1") return null;
        const raw = localStorage.getItem(PROFILE_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw) as UserProfile;
        if (!p?.fullName && !p?.email && !p?.phone) return null;
        return p;
      } catch {
        return null;
      }
    };

    void (async () => {
      // Local-only, ~0ms: do we actually hold a Supabase session on this device?
      let localUid: string | null = null;
      try {
        localUid = await withTimeout(backendGetSessionUserId(), 2000);
      } catch {
        localUid = null;
      }
      const storedProfile = readStoredSessionProfile();
      const optimistic = localUid && storedProfile ? storedProfile : null;
      if (!optimistic) {
        // No real session under the hood → clear stale markers, paint guest
        clearLocalAuth();
      }
      // Wait one tick so the session helpers (applySessionRef & co.) have bound:
      // effects run in declaration order and ours is declared before theirs.
      await new Promise<void>((r) => setTimeout(r, 0));
      if (cancelled) return;
      if (optimistic) {
        setBackendUserId(localUid);
        applySessionRef.current(optimistic);
      }
      setServerSessionReady(true);
      setAuthReady(true);
      if (cancelled) return;

      // --- Background server verification (never blocks first paint) ---
      try {
        if (!isAppBackendOnline()) {
          // Offline: keep the optimistic session we just painted; do not logout
          return;
        }
        let uid = localUid;
        if (!uid) {
          try {
            uid = await withTimeout(backendGetSessionUserId(), 12000);
          } catch {
            // Timeout / network keep optimistic session; never logout
            return;
          }
        }
        if (cancelled) return;
        if (!uid) {
          // No session anywhere real logout state (already cleared above)
          return;
        }
        setBackendUserId(uid);
        applyAccountThemeRef.current(uid);

        let profile: UserProfile | null = null;
        let flags: {
          hasMotorist: boolean;
          hasPro: boolean;
          primaryAccountType?: AccountType;
        } = {
          hasMotorist: false,
          hasPro: false,
          primaryAccountType: undefined,
        };
        try {
          const [p, f] = await Promise.all([
            withTimeout(backendLoadUserProfile(uid), 12000),
            withTimeout(backendDualRoleFlags(uid), 8000).catch(() => ({
              hasMotorist: false,
              hasPro: false,
              primaryAccountType: undefined as AccountType | undefined,
            })),
          ]);
          profile = p;
          flags = f;
        } catch {
          // Profile load failed keep optimistic local session (no sign-out)
          return;
        }
        if (cancelled) return;
        if (!profile) {
          // Session exists but profile missing: keep optimistic; do NOT sign out
          return;
        }
        const bootHasMotorist =
          flags.hasMotorist ||
          profile.accountType === "motorist" ||
          Boolean(readProfilesVault().motorist);
        const bootHasPro =
          flags.hasPro ||
          profile.accountType === "professional" ||
          Boolean(readProfilesVault().professional);
        setHasMotoristAccount(bootHasMotorist);
        setHasProAccount(bootHasPro);

        // Server role (profiles.role) is the single source of truth for the
        // active account. The local "ona-account-type" preference must NOT
        // override it: a stale value left behind by a different account or
        // session made the Repair Pro boot as a Customer and even reverse-switch
        // the server role. Role switches are persisted server-side by
        // /api/auth/switch-role, so a reload already restores the last role
        // without any local override.
        const sessionProfile: UserProfile = {
          ...profile,
          primaryAccountType:
            profile.primaryAccountType || flags.primaryAccountType || undefined,
        };
        applySessionRef.current(sessionProfile);
        // Dual Role label follows the server side-tables, not the vault.
        setHasMotoristAccount(
          flags.hasMotorist || profile.accountType === "motorist",
        );
        setHasProAccount(
          flags.hasPro || profile.accountType === "professional",
        );
      } catch {
        // Never force logout after first paint keep whatever session is live
      } finally {
        if (!cancelled) {
          setServerSessionReady(true);
          setAuthReady(true);
        }
      }
    })();

    // Absolute safety: never block boot forever on slow networks.
    const hardCap = window.setTimeout(() => {
      if (cancelled) return;
      setServerSessionReady(true);
      setAuthReady(true);
    }, 14000);

    return () => {
      cancelled = true;
      window.clearTimeout(hardCap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
