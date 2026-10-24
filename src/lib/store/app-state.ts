import type {
  AccountType,
  AppFilters,
  Booking,
  MessageThread,
  ProService,
  RegisteredAs,
  ServiceCategory,
  ServiceRequest,
  Technician,
  UserLocation,
  UserMode,
  UserProfile,
} from "@/lib/types";
import type { AppTheme, ServiceActionResult } from "./types";

export interface AppState {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (t: AppTheme) => void;
  /** Ready after localStorage role hydrate */
  roleReady: boolean;
  /** Auth + role hydrate finished */
  authReady: boolean;
  isAuthenticated: boolean;
  /** Supabase auth user id when online */
  backendUserId: string | null;
  displayName: string;
  accountType: AccountType | null;
  /**
   * Main account = role they originally signed up as.
   * Stays fixed when switching Motorist ↔ Repair Pro.
   */
  primaryAccountType: AccountType | null;
  /** Full signup profile (persisted) */
  userProfile: UserProfile | null;
  /** What user registered as drives first open screen */
  registeredAs: RegisteredAs;
  /** Current Client vs Professional view */
  userMode: UserMode;
  /** All services this pro offers (includes primary registration service) */
  proServices: ProService[];
  setRegisteredAs: (role: RegisteredAs) => void;
  setUserMode: (mode: UserMode) => void;
  /** Dual vault: true if this device has a signed-up Motorist profile */
  hasMotoristAccount: boolean;
  /** Dual vault: true if this device has a signed-up Repair Pro profile */
  hasProAccount: boolean;
  /**
   * Repair Pro Live switch when true, motorists can find this pro.
   * Synced to repair_pro_profiles.is_online.
   */
  proLive: boolean;
  /** Turn Live/Away on and push is_online to the server. Returns error message if failed. */
  setProLive: (live: boolean) => Promise<string | null>;
  /**
   * Motorist is helping someone else service pin is the other person's place.
   * Nearby pros and bookings use this meet location.
   */
  helpingSomeoneElse: boolean;
  helpingSomeoneLabel: string | null;
  /** Set meet location for “help someone else” (or clear with null) */
  setHelpingSomeoneElse: (
    next: null | {
      label: string;
      coordinates: { lat: number; lng: number };
    },
  ) => void;
  /**
   * Smooth switch Motorist ↔ Repair Pro for the signed-in user (server role flip).
   * Returns null on success, or an error / "needs_login" code.
   */
  switchAccount: (
    type: AccountType,
  ) => Promise<null | "needs_signup" | "needs_login" | string>;
  /** True while a role switch is in flight UI must not flash a wrong-role page. */
  switchingRole: boolean;
  /**
   * After Tap to Switch: must re-enter phone OTP before using the new role.
   * Cleared only by completePostSwitchPhoneOtp (not by switch payload alone).
   */
  postSwitchPhoneOtpRequired: boolean;
  /** Send OTP for post-switch re-verify (uses registered phone). */
  sendPostSwitchPhoneOtp: () => Promise<string | null>;
  /** Verify post-switch OTP (profile-verify / demo). Returns error or null. */
  completePostSwitchPhoneOtp: (code: string) => Promise<string | null>;
  /**
   * Customer → Pro: 60% bottom onboarding sheet until Care-approved T2.
   * Set on switch to professional when dual-role (has Customer).
   * Persisted per user so it returns after refresh.
   */
  proOnboardingSheetRequired: boolean;
  setProOnboardingSheetRequired: (v: boolean) => void;
  /**
   * Log in with email + password against the dual vault.
   * Optionally prefer a specific account type when both match.
   */
  /** Server-only login. Never opens the app from local vault alone. */
  signInWithPassword: (
    email: string,
    password: string,
    preferType?: AccountType,
  ) => Promise<string | null>;
  /** Request SMS OTP for registered phone (demo code 336699 always works) */
  sendPhoneOtp: (phone: string) => Promise<string | null>;
  /** Send OTP to phone or email */
  sendLoginOtp: (
    channel: "phone" | "email",
    target: string,
    opts?: { forceResend?: boolean },
  ) => Promise<{
    error: string | null;
    message?: string;
    maybeSent?: boolean;
  }>;
  /** Verify SMS OTP and open server session */
  signInWithPhoneOtp: (
    phone: string,
    code: string,
    preferType?: AccountType,
  ) => Promise<string | null>;
  /** Verify phone or email OTP and open session */
  signInWithLoginOtp: (
    channel: "phone" | "email",
    target: string,
    code: string,
    preferType?: AccountType,
  ) => Promise<string | null>;
  /** True only when Supabase session + profile are confirmed on the server */
  serverSessionReady: boolean;
  addProService: (service: ProService) => void;
  removeProService: (service: ProService) => void;
  /**
   * Complete Motorist or Repair Pro registration and sign in.
   * Each type is a separate account; one person may register both.
   * Requires live Supabase fails if the database write does not succeed.
   */
  completeSignup: (
    profile: UserProfile,
    opts?: { onErrorCode?: (code: string) => void },
  ) => Promise<string | null>;
  /**
   * Post-signup NIN + BVN verification. Unlocks unlimited book/accept.
   * Returns error message or null on success.
   */
  completeIdentityVerification: (input: {
    nin?: string;
    bvn?: string;
    primaryId?: string;
    bankId?: string;
    countryIso?: string;
    govIdKind?: string;
    govIdFrontUrl?: string;
    govIdBackUrl?: string;
    govIdVerified?: boolean;
    bankIdVerified?: boolean;
    mode?: "submit" | "approve";
  }) => Promise<string | null>;
  /** Customer Tier 1 phone OTP (demo code 336699) */
  verifyCustomerPhoneOtp: (code: string) => Promise<string | null>;
  /**
   * Edit signed-in profile (name, bio, area, vehicles you serve, etc.).
   * Vehicles-you-serve fields may only change every 28 days.
   * Returns error message or null on success.
   */
  updateUserProfile: (
    patch: Partial<UserProfile> & {
      /** When true, patch includes vehicles-served fields (enforces 28-day lock) */
      vehiclesServedChange?: boolean;
    },
  ) => string | null;
  /** Legacy quick login (prefer completeSignup) */
  login: (opts: {
    accountType: AccountType;
    name?: string;
    proService?: ProService;
    proServices?: ProService[];
  }) => void;
  logout: () => void;
  location: UserLocation;
  radiusKm: number;
  category: ServiceCategory;
  /** Motorist specialty pick (Home / Office / …) for plumber etc. */
  specialtyFilter: string | null;
  /**
   * When true, home sheet shows specialty chips instead of radius
   * (plumber / carpenter / painter / solar / generator).
   */
  specialtyPickerOpen: boolean;
  query: string;
  filters: AppFilters;
  selectedTechId: string | null;
  technicians: Technician[];
  visibleTechnicians: Technician[];
  requests: ServiceRequest[];
  bookings: Booking[];
  messages: MessageThread[];
  /** Threads for active role only (motorist vs pro skill) no mix-up */
  visibleMessageThreads: MessageThread[];
  locationError: string | null;
  isLocating: boolean;
  /** Re-fetch Live Repair Pros only (no location / filter changes) */
  refreshNearbyPros: () => void;
  setRadiusKm: (n: number) => void;
  setCategory: (c: ServiceCategory) => void;
  setSpecialtyFilter: (s: string | null) => void;
  /** Open specialty strip again for current trade (re-tap trade) */
  openSpecialtyPicker: () => void;
  setQuery: (q: string) => void;
  toggleFilter: (key: keyof AppFilters) => void;
  setSelectedTechId: (id: string | null) => void;
  /**
   * Motorist book help gated after free trial requests.
   * Prefer this over raw createRequest for UI flows.
   */
  bookRequest: (
    tech: Technician,
    problem?: string,
    pricing?: {
      labourBaseMajor: number;
      labourAgreedMajor: number;
      discountPercent: number;
      pricingCurrency: import("@/lib/pricing").AppCurrency;
      negotiationStatus?: ServiceRequest["negotiationStatus"];
    },
  ) => ServiceActionResult;
  /** @deprecated use bookRequest still creates without gate for internal/demo */
  createRequest: (
    tech: Technician,
    problem?: string,
    pricing?: {
      labourBaseMajor: number;
      labourAgreedMajor: number;
      discountPercent: number;
      pricingCurrency: import("@/lib/pricing").AppCurrency;
      negotiationStatus?: ServiceRequest["negotiationStatus"];
    },
  ) => ServiceRequest;
  /**
   * Pro accept (or other status). Accept is gated by verification funnel.
   * Pros can only accept jobs matching their registered skill.
   */
  updateRequestStatus: (
    id: string,
    status: ServiceRequest["status"],
  ) => Promise<ServiceActionResult>;
  ensureChatForRequest: (req: ServiceRequest) => string;
  /**
   * Ensure cloud conversation exists and return the real conversation UUID
   * (required so both parties see each other's messages).
   */
  ensureChatForRequestAsync: (req: ServiceRequest) => Promise<string>;
  /** Re-fetch messages from server (other party + multi-device). */
  refreshCloudChats: () => void;
  sendChatMessage: (
    threadId: string,
    text: string,
    voice?: {
      url: string;
      durationSec?: number;
      mime?: string;
    } | null,
  ) => void;
  /** Opened a chat clear unread badge + persist read_at on server */
  markThreadRead: (threadId: string) => void;
  retryLocation: () => void;
  setManualLocation: (
    label: string,
    coords?: { lat: number; lng: number },
  ) => void;
}
