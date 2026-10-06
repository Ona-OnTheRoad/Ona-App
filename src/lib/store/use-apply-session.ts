import { useCallback } from "react";
import { DEFAULT_RADIUS_KM, MAX_RADIUS_KM } from "@/lib/matching";
import { isProService } from "@/lib/pro-service-id";
import { readProfilesVault } from "@/lib/profiles-vault";
import type { AccountType, RegisteredAs, UserProfile } from "@/lib/types";
import {
  AUTH_ACCOUNT_KEY,
  AUTH_KEY,
  AUTH_NAME_KEY,
  MODE_KEY,
  PROFILE_KEY,
  ROLE_KEY,
  SERVICES_KEY,
} from "./constants";
import { readStoredPrimaryAccount, writeStoredPrimaryAccount } from "./storage";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";
import type { ThemeAndProSheetResult } from "./use-theme-and-pro-sheet";

export function useApplySession(
  session: SessionStateResult,
  market: MarketStateResult,
  themeApi: ThemeAndProSheetResult,
) {
  const {
    setIsAuthenticated,
    setDisplayName,
    setAccountType,
    primaryAccountType,
    setPrimaryAccountType,
    userProfile,
    setUserProfile,
    setRegisteredAsState,
    setUserModeState,
    setProServicesState,
    setHasMotoristAccount,
    setHasProAccount,
  } = session;
  const { setLocation, setRadiusKmState } = market;
  const { applyAccountTheme } = themeApi;

  const setRegisteredAs = useCallback(
    (role: RegisteredAs) => {
      setRegisteredAsState(role);
      try {
        localStorage.setItem(ROLE_KEY, role);
      } catch {
        /* ignore */
      }
      if (isProService(role)) {
        setProServicesState((prev) => {
          const next = prev.includes(role) ? prev : [role, ...prev];
          try {
            localStorage.setItem(SERVICES_KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });
        setUserModeState("professional");
        try {
          localStorage.setItem(MODE_KEY, "professional");
        } catch {
          /* ignore */
        }
      } else {
        setUserModeState("client");
        try {
          localStorage.setItem(MODE_KEY, "client");
        } catch {
          /* ignore */
        }
      }
    },
    [setProServicesState, setRegisteredAsState, setUserModeState],
  );

  /** Activate a stored profile as the current session (after signup / switch / login). */
  const applySession = useCallback(
    (profile: UserProfile) => {
      const name = profile.fullName.trim() || "User";
      // Main account = original signup. Prefer server primary, then stored, then
      // existing session primary never replace a known primary with the active role.
      const storedPrimary = readStoredPrimaryAccount();
      const primary: AccountType =
        profile.primaryAccountType ||
        storedPrimary ||
        primaryAccountType ||
        profile.accountType;
      // Pros: keep only first/primary signup skill; clamp service radius to 5 km
      const proServicesLocked =
        profile.accountType === "professional"
          ? (profile.services ?? []).filter(isProService).slice(0, 1)
          : profile.services;
      const proRadiusLocked =
        profile.accountType === "professional"
          ? Math.min(
              MAX_RADIUS_KM,
              Math.max(1, profile.serviceRadiusKm ?? DEFAULT_RADIUS_KM),
            )
          : profile.serviceRadiusKm;
      const withPrimary: UserProfile = {
        ...profile,
        primaryAccountType: primary,
        ...(profile.accountType === "professional"
          ? {
              services: proServicesLocked?.length
                ? proServicesLocked
                : profile.services,
              serviceRadiusKm: proRadiusLocked,
            }
          : {}),
        // Preserve vehicle fields across role switches / re-signups that may omit them
        vehicleMake: profile.vehicleMake ?? userProfile?.vehicleMake,
        vehicleModel: profile.vehicleModel ?? userProfile?.vehicleModel,
        vehicleYear: profile.vehicleYear ?? userProfile?.vehicleYear,
        vehiclePlate: profile.vehiclePlate ?? userProfile?.vehiclePlate,
        vehiclePhoto: profile.vehiclePhoto ?? userProfile?.vehiclePhoto,
        vehicleCommonIssues:
          profile.vehicleCommonIssues ?? userProfile?.vehicleCommonIssues,
        vehicles: profile.vehicles ?? userProfile?.vehicles,
      };
      setUserProfile(withPrimary);
      setDisplayName(name);
      setAccountType(profile.accountType);
      setPrimaryAccountType(primary);
      setIsAuthenticated(true);
      writeStoredPrimaryAccount(primary);

      // Load this account's personal theme (full app theme per user)
      const uid = profile.identityId || null;
      if (uid) applyAccountTheme(uid);

      try {
        localStorage.setItem(AUTH_KEY, "1");
        localStorage.setItem(AUTH_NAME_KEY, name);
        localStorage.setItem(AUTH_ACCOUNT_KEY, profile.accountType);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(withPrimary));
      } catch {
        /* ignore */
      }

      if (profile.accountType === "motorist") {
        setRegisteredAsState("client");
        setUserModeState("client");
        try {
          localStorage.setItem(MODE_KEY, "client");
          localStorage.setItem(ROLE_KEY, "client");
        } catch {
          /* ignore */
        }
      } else {
        const primarySvc =
          (withPrimary.services ?? []).filter(isProService)[0] ?? "mechanic";
        setProServicesState([primarySvc]);
        setRegisteredAsState(primarySvc);
        setUserModeState("professional");
        try {
          localStorage.setItem(MODE_KEY, "professional");
          localStorage.setItem(ROLE_KEY, primarySvc);
          localStorage.setItem(SERVICES_KEY, JSON.stringify([primarySvc]));
        } catch {
          /* ignore */
        }
        setRadiusKmState(
          Math.min(
            MAX_RADIUS_KM,
            Math.max(1, withPrimary.serviceRadiusKm ?? DEFAULT_RADIUS_KM),
          ),
        );
      }

      // Profile area is a label only never overwrite live GPS with a fixed city
      if (profile.area || profile.city) {
        setLocation((prev) => ({
          ...prev,
          label:
            prev.label &&
            prev.label !== "Locating…" &&
            prev.label !== "Current location" &&
            prev.label !== "Last known location"
              ? prev.label
              : [profile.area, profile.city].filter(Boolean).join(", "),
          city: profile.city || profile.area || prev.city,
          // keep real coordinates from GPS / last-known never force Ikeja
        }));
      }

      // Dual-role flags: never replace server truth with vault alone.
      // Vault is device-local and often only holds the last active side (e.g. motorist),
      // which incorrectly showed "no Repair Pro account" for dual-role users.
      setHasMotoristAccount((prev) =>
        Boolean(
          prev ||
          profile.accountType === "motorist" ||
          readProfilesVault().motorist,
        ),
      );
      setHasProAccount((prev) =>
        Boolean(
          prev ||
          profile.accountType === "professional" ||
          readProfilesVault().professional,
        ),
      );
    },
    [
      applyAccountTheme,
      primaryAccountType,
      setAccountType,
      setDisplayName,
      setHasMotoristAccount,
      setHasProAccount,
      setIsAuthenticated,
      setLocation,
      setPrimaryAccountType,
      setProServicesState,
      setRadiusKmState,
      setRegisteredAsState,
      setUserModeState,
      setUserProfile,
    ],
  );
  return {
    setRegisteredAs,
    applySession,
  };
}

export type ApplySessionResult = ReturnType<typeof useApplySession>;
