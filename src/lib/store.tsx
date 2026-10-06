"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppState } from "./store/app-state";
import { useAccountActions } from "./store/use-account-actions";
import { useApplySession } from "./store/use-apply-session";
import { useAppValue } from "./store/use-app-value";
import { useBootSession } from "./store/use-boot-session";
import { useChats } from "./store/use-chats";
import { useCloudData } from "./store/use-cloud-data";
import { useCloudRealtime } from "./store/use-cloud-realtime";
import { useFilters } from "./store/use-filters";
import { useHomeUiSession } from "./store/use-home-ui-session";
import { useLocationAndRadius } from "./store/use-location";
import { useLoginOtp } from "./store/use-login-otp";
import { useMarketState } from "./store/use-market-state";
import { useProLiveSync } from "./store/use-pro-live-sync";
import { useProfilePersistence } from "./store/use-profile-persistence";
import { useRequestStatus } from "./store/use-request-status";
import { useRequests } from "./store/use-requests";
import { useSessionState } from "./store/use-session-state";
import { useSignIn } from "./store/use-sign-in";
import { useSignup } from "./store/use-signup";
import { useSwitchAccount } from "./store/use-switch-account";
import { useTechnicians } from "./store/use-technicians";
import { useThemeAndProSheet } from "./store/use-theme-and-pro-sheet";
import { useUpdateProfile } from "./store/use-update-profile";

export type { AppTheme, ServiceActionResult } from "./store/types";
export { SELF_PRO_TECH_ID } from "./store/constants";
export { profileToTechnician } from "./store/technician";

const AppContext = createContext<AppState | null>(null);

/**
 * App-wide state provider. A thin composition: each domain lives in a hook
 * under ./store/, called here in the same order the hooks (and so their
 * effects) always ran in. Hook order matters: do not reorder.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const session = useSessionState();
  const market = useMarketState();
  useBootSession(session);
  useHomeUiSession(session, market);
  const themeApi = useThemeAndProSheet(session);
  const applyApi = useApplySession(session, market, themeApi);
  const switchApi = useSwitchAccount(session, applyApi);
  const signInApi = useSignIn(session, applyApi);
  const loginOtpApi = useLoginOtp(session, applyApi);
  const profileApi = useProfilePersistence(session);
  const updateApi = useUpdateProfile(session, profileApi);
  const signupApi = useSignup(session, market, applyApi);
  const accountApi = useAccountActions(session, market);
  const techApi = useTechnicians(session, market);
  const filterApi = useFilters(market);
  const chatApi = useChats(session, market);
  const requestApi = useRequests(session, market, profileApi);
  const statusApi = useRequestStatus(session, market, profileApi);
  const cloudApi = useCloudData(session, market, themeApi, applyApi);
  useCloudRealtime(session, market, cloudApi);
  useProLiveSync(session, cloudApi);
  const locationApi = useLocationAndRadius(session, market);

  const value = useAppValue(
    session,
    market,
    themeApi,
    applyApi,
    switchApi,
    signInApi,
    loginOtpApi,
    profileApi,
    updateApi,
    signupApi,
    accountApi,
    techApi,
    filterApi,
    chatApi,
    requestApi,
    statusApi,
    cloudApi,
    locationApi,
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
