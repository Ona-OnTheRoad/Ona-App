import { useCallback, useRef, useState } from "react";
import { writeProOnboardingSheetFlag } from "@/lib/pro-switch-onboarding";
import type {
  AccountType,
  ProService,
  RegisteredAs,
  UserMode,
  UserProfile,
} from "@/lib/types";
import {
  AUTH_ACCOUNT_KEY,
  AUTH_KEY,
  AUTH_NAME_KEY,
  PRIMARY_ACCOUNT_KEY,
  PROFILE_KEY,
} from "./constants";
import type { AppTheme } from "./types";

export function useSessionState() {
  // Default follows OS; may be overridden by double-click (stored)
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [themeReady, setThemeReady] = useState(false);
  // Role / mode registration drives first open
  const [roleReady, setRoleReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState("Guest");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [primaryAccountType, setPrimaryAccountType] =
    useState<AccountType | null>(null);
  /** True during an explicit role switch blocks wrong-role page flash. */
  const [switchingRole, setSwitchingRole] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [registeredAs, setRegisteredAsState] = useState<RegisteredAs>("client");
  const [userMode, setUserModeState] = useState<UserMode>("client");
  const [proServices, setProServicesState] = useState<ProService[]>([]);
  const [hasMotoristAccount, setHasMotoristAccount] = useState(false);
  const [hasProAccount, setHasProAccount] = useState(false);
  /** Live = visible to motorists; Away = hidden (stays on until pro turns it off) */
  const [proLive, setProLiveState] = useState(false);
  /** Session-only: force phone OTP after every successful Tap to Switch */
  const [postSwitchPhoneOtpRequired, setPostSwitchPhoneOtpRequired] =
    useState(false);
  /** Customer → Pro: bottom-sheet onboarding until Care-approved T2 */
  const [proOnboardingSheetRequired, setProOnboardingSheetRequiredState] =
    useState(false);
  const [helpingSomeoneElse, setHelpingSomeoneElseState] = useState(false);
  const [helpingSomeoneLabel, setHelpingSomeoneLabel] = useState<string | null>(
    null,
  );
  /** Late-bound session helpers (effects run before useCallback declarations) */
  const applySessionRef = useRef<(profile: UserProfile) => void>(() => {});
  const applyAccountThemeRef = useRef<
    (userId: string | null | undefined) => void
  >(() => {});
  /** Supabase auth.users id when backend session is active */
  const [backendUserId, setBackendUserId] = useState<string | null>(null);
  const setProOnboardingSheetRequired = useCallback(
    (v: boolean) => {
      setProOnboardingSheetRequiredState(v);
      writeProOnboardingSheetFlag(backendUserId, v);
    },
    [backendUserId],
  );
  /** True only after server session is checked (and confirmed or cleared) */
  const [serverSessionReady, setServerSessionReady] = useState(false);

  const clearLocalAuth = useCallback(() => {
    setIsAuthenticated(false);
    setBackendUserId(null);
    setDisplayName("Guest");
    setAccountType(null);
    setPrimaryAccountType(null);
    setUserProfile(null);
    setProOnboardingSheetRequiredState(false);
    setPostSwitchPhoneOtpRequired(false);
    setProLiveState(false);
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_NAME_KEY);
      localStorage.removeItem(AUTH_ACCOUNT_KEY);
      localStorage.removeItem(PRIMARY_ACCOUNT_KEY);
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* ignore */
    }
  }, []);
  return {
    theme,
    setThemeState,
    themeReady,
    setThemeReady,
    roleReady,
    setRoleReady,
    authReady,
    setAuthReady,
    isAuthenticated,
    setIsAuthenticated,
    displayName,
    setDisplayName,
    accountType,
    setAccountType,
    primaryAccountType,
    setPrimaryAccountType,
    switchingRole,
    setSwitchingRole,
    userProfile,
    setUserProfile,
    registeredAs,
    setRegisteredAsState,
    userMode,
    setUserModeState,
    proServices,
    setProServicesState,
    hasMotoristAccount,
    setHasMotoristAccount,
    hasProAccount,
    setHasProAccount,
    proLive,
    setProLiveState,
    postSwitchPhoneOtpRequired,
    setPostSwitchPhoneOtpRequired,
    proOnboardingSheetRequired,
    setProOnboardingSheetRequiredState,
    helpingSomeoneElse,
    setHelpingSomeoneElseState,
    helpingSomeoneLabel,
    setHelpingSomeoneLabel,
    applySessionRef,
    applyAccountThemeRef,
    backendUserId,
    setBackendUserId,
    setProOnboardingSheetRequired,
    serverSessionReady,
    setServerSessionReady,
    clearLocalAuth,
  };
}

export type SessionStateResult = ReturnType<typeof useSessionState>;
