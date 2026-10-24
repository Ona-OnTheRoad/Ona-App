import { useCallback, useRef } from "react";
import { FLOW_SESSION_KEYS } from "@/lib/flow-sessions";
import { isProService } from "@/lib/pro-service-id";
import { clearProSetupSheetState } from "@/lib/pro-switch-onboarding";
import { readProfilesVault } from "@/lib/profiles-vault";
import { clearSession } from "@/lib/session-restore";
import { playAppSound } from "@/lib/sound-tone";
import {
  backendLogout,
  backendSetProOnline,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { ProService, UserLocation } from "@/lib/types";
import {
  AUTH_ACCOUNT_KEY,
  AUTH_KEY,
  AUTH_NAME_KEY,
  HOME_UI_SESSION_KEY,
  PRIMARY_ACCOUNT_KEY,
  PROFILE_KEY,
  SERVICES_KEY,
} from "./constants";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";

export function useAccountActions(
  session: SessionStateResult,
  market: MarketStateResult,
) {
  const {
    setIsAuthenticated,
    setDisplayName,
    accountType,
    setAccountType,
    setPrimaryAccountType,
    setUserProfile,
    registeredAs,
    setProServicesState,
    setHasMotoristAccount,
    setHasProAccount,
    setProLiveState,
    setPostSwitchPhoneOtpRequired,
    setProOnboardingSheetRequiredState,
    setHelpingSomeoneElseState,
    setHelpingSomeoneLabel,
    backendUserId,
    setBackendUserId,
  } = session;
  const { location, setLocation, setRequests, setMessages, setCloudTechs } =
    market;

  const ownLocationBackup = useRef<UserLocation | null>(null);
  const setProLive = useCallback(
    async (live: boolean): Promise<string | null> => {
      // Pro stays Live until they turn it off (or leave pro mode / log out)
      if (live && accountType !== "professional") {
        return "Switch to Repair Pro mode first.";
      }
      if (!backendUserId || !isAppBackendOnline()) {
        // Never flip local Away while server stays Live require server for both
        return "Server offline. Connect to go Live or Away so customers stay in sync.";
      }
      if (accountType !== "professional") {
        await backendSetProOnline(backendUserId, false);
        setProLiveState(false);
        return null;
      }

      // Local draft gate only when an onboarding profile exists in this browser.
      // Missing local artisan must NOT blank/block dashboard server owns Live.
      if (live) {
        try {
          const { getArtisanProfile } =
            await import("@/lib/artisan/local-store");
          const { canGoLive } = await import("@/lib/artisan/status");
          const artisan = getArtisanProfile(backendUserId);
          if (artisan) {
            const gate = canGoLive(artisan);
            if (!gate.allowed) {
              return gate.message;
            }
          }
        } catch {
          /* fall through server enforces */
        }
      }

      // Going Live: prefer fresh high-accuracy GPS so motorists see you nearby
      let lat = location.coordinates.lat;
      let lng = location.coordinates.lng;
      if (live && typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 4000,
                maximumAge: 60000,
              });
            },
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setLocation((prev) => ({
            ...prev,
            coordinates: { lat, lng },
          }));
        } catch {
          /* fall back to last known */
        }
      }

      // Without a real pin, fall back to base default Lagos coordinates so Go Live succeeds
      if (
        live &&
        (!Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          (lat === 0 && lng === 0))
      ) {
        lat = 6.5244;
        lng = 3.3792;
        setLocation((prev) => ({
          ...prev,
          coordinates: { lat, lng },
        }));
      }

      const err = await backendSetProOnline(backendUserId, live, {
        lat,
        lng,
      });
      if (err) {
        console.warn("setProLive:", err);
        if (live) {
          setProLiveState(false);
          try {
            localStorage.setItem("ona-pro-live", "0");
          } catch {
            /* ignore */
          }
        }
        return err;
      }
      setProLiveState(live);
      try {
        localStorage.setItem("ona-pro-live", live ? "1" : "0");
      } catch {
        /* ignore */
      }
      playAppSound(live ? "pro_live" : "pro_away");
      return null;
    },
    [
      backendUserId,
      accountType,
      location.coordinates.lat,
      location.coordinates.lng,
      setLocation,
      setProLiveState,
    ],
  );

  const setHelpingSomeoneElse = useCallback(
    (
      next: null | {
        label: string;
        coordinates: { lat: number; lng: number };
      },
    ) => {
      if (next == null) {
        setHelpingSomeoneElseState(false);
        setHelpingSomeoneLabel(null);
        if (ownLocationBackup.current) {
          setLocation(ownLocationBackup.current);
          ownLocationBackup.current = null;
        }
        return;
      }
      if (!ownLocationBackup.current) {
        ownLocationBackup.current = location;
      }
      setHelpingSomeoneElseState(true);
      setHelpingSomeoneLabel(next.label);
      setLocation({
        label: next.label,
        city: next.label,
        coordinates: next.coordinates,
      });
    },
    [location, setHelpingSomeoneElseState, setHelpingSomeoneLabel, setLocation],
  );

  const logout = useCallback(() => {
    // Server-side Live OFF + session clear (prevents ghost online / previous pro)
    void backendLogout();

    const uid = backendUserId;
    setBackendUserId(null);
    setIsAuthenticated(false);
    setAccountType(null);
    setPrimaryAccountType(null);
    setProLiveState(false);
    setPostSwitchPhoneOtpRequired(false);
    setProOnboardingSheetRequiredState(false);
    setDisplayName("Guest");
    setUserProfile(null);
    setCloudTechs([]);
    setRequests([]);
    setMessages([]);
    // Keep dual vault so both accounts remain for future login / switch after re-auth
    try {
      clearProSetupSheetState(uid);
      localStorage.setItem("ona-pro-live", "0");
      localStorage.removeItem("ona-pro-live");
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_NAME_KEY);
      localStorage.removeItem(AUTH_ACCOUNT_KEY);
      localStorage.removeItem(PRIMARY_ACCOUNT_KEY);
      localStorage.removeItem(PROFILE_KEY);
      clearSession(HOME_UI_SESSION_KEY);
      for (const key of Object.values(FLOW_SESSION_KEYS)) {
        clearSession(key);
      }
      const vault = readProfilesVault();
      setHasMotoristAccount(Boolean(vault.motorist));
      setHasProAccount(Boolean(vault.professional));
    } catch {
      /* ignore */
    }
  }, [
    backendUserId,
    setAccountType,
    setBackendUserId,
    setCloudTechs,
    setDisplayName,
    setHasMotoristAccount,
    setHasProAccount,
    setIsAuthenticated,
    setMessages,
    setPostSwitchPhoneOtpRequired,
    setPrimaryAccountType,
    setProLiveState,
    setProOnboardingSheetRequiredState,
    setRequests,
    setUserProfile,
  ]);

  /** One professional skill only ignore adds beyond the first. */
  const addProService = useCallback(
    (service: ProService) => {
      setProServicesState((prev) => {
        if (prev.length >= 1) return prev;
        if (prev.includes(service)) return prev;
        const next = [service];
        try {
          localStorage.setItem(SERVICES_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [setProServicesState],
  );

  const removeProService = useCallback(
    (service: ProService) => {
      setProServicesState((prev) => {
        // Keep at least the primary registration service if pro
        if (isProService(registeredAs) && service === registeredAs) {
          return prev;
        }
        const next = prev.filter((s) => s !== service);
        try {
          localStorage.setItem(SERVICES_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [registeredAs, setProServicesState],
  );
  return {
    setProLive,
    setHelpingSomeoneElse,
    logout,
    addProService,
    removeProService,
  };
}

export type AccountActionsResult = ReturnType<typeof useAccountActions>;
