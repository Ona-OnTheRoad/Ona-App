import { LEGACY_PROFILE_KEY } from "@/lib/profiles-vault";
import type { AppFilters, ServiceCategory } from "@/lib/types";

/** The Orders desk cannot accept: that is Open/Confirm on the incoming panel. */
export const ACCEPT_VIA_JOB_FLOW_MESSAGE =
  "Open this request from the incoming request panel to accept it.";

export const ROLE_KEY = "ona-role";
export const SERVICES_KEY = "ona-pro-services";
export const MODE_KEY = "ona-mode";
export const AUTH_KEY = "ona-auth";
export const AUTH_NAME_KEY = "ona-auth-name";
export const AUTH_ACCOUNT_KEY = "ona-account-type";
/** Original signup role never overwritten by Motorist ↔ Pro switch */
export const PRIMARY_ACCOUNT_KEY = "ona-primary-account";
export const PROFILE_KEY = LEGACY_PROFILE_KEY;
/** Session-scoped home-screen position (tab, flow, filters) restored on refresh. */
export const HOME_UI_SESSION_KEY = "ona-session-home-ui";
/** Device-level theme fallback when no account is active */
export const DEVICE_THEME_KEY = "ona-theme";

/** Public directory id for the signed-in Repair Pro (motorists can open this profile). */
export const SELF_PRO_TECH_ID = "pro-self";

/** Refresh GPS every 20 minutes while the app tab is open/visible */
export const LOCATION_REFRESH_MS = 20 * 60 * 1000;

export const defaultFilters: AppFilters = {
  nearest: true,
  rating45: false,
  availableNow: false,
  verified: false,
  fastResponse: false,
};

export const CATEGORY_VALUES: ServiceCategory[] = [
  "mechanic",
  "vulcanizer",
  "towing",
  "battery",
  "ac",
  "body",
  "electrical",
  "diagnostics",
  "fashion",
  "plumber",
  "carpenter",
  "painter",
  "solar",
  "generator",
  "all",
  "none",
];
