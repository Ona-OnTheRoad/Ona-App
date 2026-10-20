"use client";

/**
 * Main-app Supabase data layer (auth, pros, jobs, chat).
 * Falls back gracefully when keys/session missing.
 */

import { getAppSupabase, isAppBackendOnline } from "@/lib/supabase/app-client";
import { profileToUserProfile, type MessageRow } from "@/lib/supabase/mappers";
import type { ProfileRow } from "@/lib/supabase/types";
import type {
  AccountType,
  ProService,
  ServiceRequest,
  Technician,
  UserProfile,
  MessageThread,
} from "@/lib/types";
import { isProService } from "@/lib/pro-service-id";
import {
  apiVerifyIdemOp,
  clearIdemKey,
  getOrCreateIdemKey,
} from "@/lib/jobs/idempotency";

import type { DiagnosticContext } from "@/lib/jobs/diagnostics/types";
import { recordJobDiagnostic } from "@/lib/jobs/diagnostics/collector";
import type { JobSource } from "@/lib/jobs/diagnostics/types";

export { isAppBackendOnline };
export type { MessageRow };

export async function backendSignUp(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  accountType: AccountType;
  gender: "male" | "female" | "prefer_not_to_say";
  dateOfBirth: string;
  city?: string;
  area?: string;
  /** Repair pro */
  businessName?: string;
  primaryService?: ProService;
  services?: ProService[];
  bio?: string;
  yearsExperience?: string;
  serviceRadiusKm?: number;
  lat?: number;
  lng?: number;
  /** Motorist */
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  plateNumber?: string;
  vehiclePhoto?: string;
  vehicleCommonIssues?: string[];
  /** Unlimited motorist vehicles (JSON) */
  vehicles?: import("@/lib/types").MotoristVehicle[];
  avatarUrl?: string;
  /** Identity (optional at signup) */
  nin?: string;
  bvn?: string;
  labourPrices?: Partial<Record<ProService, number | string>>;
  pricingCurrency?: import("@/lib/pricing").AppCurrency;
  vehicleFocus?: Record<string, unknown>;
  skillAnswers?: Record<string, unknown>;
  servedVehicleType?: string;
  servedBrand?: string;
  servedModel?: string;
  servedCountry?: string;
  servedLocation?: string;
  emergencyContact?: { name: string; phone: string };
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankCode?: string;
  keepOtherRole?: boolean;
  guarantor?: UserProfile["guarantor"];
  docsStatus?: UserProfile["docsStatus"];
  certificationFileName?: string;
  certificationFileDataUrl?: string;
  refCode?: string;
  /** Dual-role: bind new role to this session identity */
  access_token?: string;
}): Promise<{ error: string | null; userId?: string; profile?: UserProfile }> {
  /**
   * Server-side signup (service role, email auto-confirmed).
   * Avoids Supabase browser signUp confirmation emails that hit:
   * "For security purposes, you can only request this after X seconds"
   */
  // Prefer live session token so dual-role always attaches to the signed-in user
  let accessToken = input.access_token;
  if (!accessToken) {
    try {
      const { ensureAppSession } = await import("@/lib/supabase/session");
      const s = await ensureAppSession();
      accessToken = s?.accessToken;
    } catch {
      /* guest signup */
    }
  }

  let res: Response;
  try {
    res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
              "x-access-token": accessToken,
            }
          : {}),
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        fullName: input.fullName,
        phone: input.phone,
        accountType: input.accountType,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth,
        city: input.city,
        area: input.area,
        businessName: input.businessName,
        primaryService: input.primaryService,
        services: input.services,
        bio: input.bio,
        yearsExperience: input.yearsExperience,
        serviceRadiusKm: input.serviceRadiusKm,
        lat: input.lat,
        lng: input.lng,
        vehicleMake: input.vehicleMake,
        vehicleModel: input.vehicleModel,
        vehicleYear: input.vehicleYear,
        plateNumber: input.plateNumber,
        vehiclePhoto: input.vehiclePhoto,
        vehicleCommonIssues: input.vehicleCommonIssues,
        vehicles: input.vehicles,
        avatarUrl: input.avatarUrl,
        nin: input.nin,
        bvn: input.bvn,
        labourPrices: input.labourPrices,
        pricingCurrency: input.pricingCurrency,
        vehicleFocus: input.vehicleFocus,
        skillAnswers: input.skillAnswers,
        servedVehicleType: input.servedVehicleType,
        servedBrand: input.servedBrand,
        servedModel: input.servedModel,
        servedCountry: input.servedCountry,
        servedLocation: input.servedLocation,
        emergencyContact: input.emergencyContact,
        bankName: input.bankName,
        bankAccountName: input.bankAccountName,
        bankAccountNumber: input.bankAccountNumber,
        bankCode: input.bankCode,
        guarantor: input.guarantor,
        keepOtherRole: input.keepOtherRole !== false,
        refCode: input.refCode,
        docsStatus: input.docsStatus,
        certificationFileName: input.certificationFileName,
        certificationFileDataUrl: input.certificationFileDataUrl,
        access_token: accessToken,
      }),
    });
  } catch {
    return {
      error:
        "Network error during sign-up. Check your connection and try once more.",
    };
  }

  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: { message?: string; code?: string };
    data?: {
      userId?: string;
      session?: {
        access_token: string;
        refresh_token: string;
      } | null;
      profile?: ProfileRow;
      extras?: {
        vehicleMake?: string;
        vehicleModel?: string;
        vehicleYear?: string;
        vehicles?: import("@/lib/types").MotoristVehicle[];
        businessName?: string;
        primaryService?: string;
        bio?: string;
        yearsExperience?: string;
        serviceRadiusKm?: number;
        nin?: string;
        bvn?: string;
        ninVerified?: boolean;
        bvnVerified?: boolean;
      };
      warning?: string;
    };
  } | null;

  if (!json?.ok || !json.data?.userId || !json.data.profile) {
    const msg =
      json?.error?.message ||
      (res.status === 429
        ? "Too many sign-up attempts. Wait about a minute, then try once."
        : "Sign-up failed. Please try again.");
    return { error: msg };
  }

  // Establish browser session so the app is logged in immediately
  const sb = getAppSupabase();
  if (
    sb &&
    json.data.session?.access_token &&
    json.data.session?.refresh_token
  ) {
    const { error: sessionErr } = await sb.auth.setSession({
      access_token: json.data.session.access_token,
      refresh_token: json.data.session.refresh_token,
    });
    if (sessionErr) {
      // Fallback: password sign-in so signup never leaves user "not signed in"
      const { error: loginErr } = await sb.auth.signInWithPassword({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      });
      if (loginErr) {
        console.warn(
          "session after signup:",
          sessionErr.message,
          loginErr.message,
        );
      }
    }
  } else if (sb && json.data.userId) {
    // Account saved but no session tokens try password login once
    const { error: loginErr } = await sb.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
    if (loginErr) {
      console.warn("login after signup:", loginErr.message);
    }
  }

  const p = json.data.profile;
  const ex = json.data.extras || {};
  const role = p.role === "repair_pro" ? "repair_pro" : "motorist";
  const hasNin = Boolean(ex.ninVerified);
  const hasBvn = Boolean(ex.bvnVerified);
  const primary =
    ex.primaryService && isProService(ex.primaryService)
      ? (ex.primaryService as ProService)
      : undefined;

  const profile = profileToUserProfile(
    {
      id: p.id,
      role,
      full_name: p.full_name,
      phone: p.phone,
      email: p.email,
      avatar_url: p.avatar_url ?? null,
      city: p.city,
      area: p.area,
      gender: p.gender ?? input.gender,
      date_of_birth: p.date_of_birth ?? input.dateOfBirth,
      is_active: p.is_active ?? true,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString(),
    },
    {
      accountType: input.accountType,
      password: input.password,
      services: primary
        ? [primary]
        : input.primaryService
          ? [input.primaryService]
          : undefined,
      businessName: ex.businessName || input.businessName,
      bio: ex.bio || input.bio,
      yearsExperience: ex.yearsExperience || input.yearsExperience,
      serviceRadiusKm: ex.serviceRadiusKm ?? input.serviceRadiusKm,
      vehicleMake: ex.vehicleMake || input.vehicleMake,
      vehicleModel: ex.vehicleModel || input.vehicleModel,
      vehicleYear: ex.vehicleYear || input.vehicleYear,
      vehicles:
        (Array.isArray(ex.vehicles) && ex.vehicles.length
          ? ex.vehicles
          : input.vehicles) || undefined,
      idNumber: ex.nin || (hasNin ? input.nin : undefined),
      bvn: ex.bvn || (hasBvn ? input.bvn : undefined),
      ninVerified: hasNin,
      bvnVerified: hasBvn,
      identityVerifiedAt:
        hasNin && hasBvn ? new Date().toISOString() : undefined,
      docsStatus: input.docsStatus,
      certificationFileName: input.certificationFileName,
      certificationFileDataUrl: input.certificationFileDataUrl,
      skillAnswers: input.skillAnswers as UserProfile["skillAnswers"],
    },
  );

  return { error: null, userId: json.data.userId, profile };
}

/** Persist NIN/BVN verification to Supabase role tables. */
/** Persist profile fields (labour prices, vehicle, bank, etc.) to Supabase. */
export async function backendUpdateProfile(
  accessToken: string,
  patch: Record<string, unknown>,
): Promise<string | null> {
  const { ensureAppSession, SESSION_RELOGIN_MESSAGE } =
    await import("@/lib/supabase/session");
  try {
    // Prefer a freshly refreshed token over a possibly stale caller token
    const session = await ensureAppSession();
    const token = session?.accessToken || accessToken;
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-access-token": token,
      },
      body: JSON.stringify({ access_token: token, ...patch }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string; code?: string };
    } | null;
    if (!json?.ok) {
      if (json?.error?.code === "session_expired") {
        // One more refresh + retry
        const again = await ensureAppSession({
          refreshIfExpiresWithinMs: 3_600_000,
        });
        if (again?.accessToken) {
          const retry = await fetch("/api/profile/update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${again.accessToken}`,
              "x-access-token": again.accessToken,
            },
            body: JSON.stringify({
              access_token: again.accessToken,
              ...patch,
            }),
          });
          const retryJson = (await retry.json().catch(() => null)) as {
            ok?: boolean;
            error?: { message?: string; code?: string };
          } | null;
          if (retryJson?.ok) return null;
        }
        return SESSION_RELOGIN_MESSAGE;
      }
      if (json?.error?.code === "bank_account_in_use") {
        return (
          json.error.message ||
          "This bank is already used on another Ona account."
        );
      }
      return json?.error?.message || "Could not save profile";
    }
    return null;
  } catch {
    return "Network error saving profile";
  }
}

/** Phone/email OTP login session after code verified (demo 336699 always ok). */
export async function backendSignInWithOtp(input: {
  channel: "phone" | "email";
  target: string;
  code: string;
  preferType?: AccountType;
}): Promise<{ error: string | null; profile?: UserProfile; userId?: string }> {
  try {
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: input.channel,
        target: input.target,
        code: input.code,
        preferType: input.preferType,
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string };
      data?: {
        userId?: string;
        session?: { access_token: string; refresh_token: string };
        userProfile?: UserProfile;
      };
    } | null;

    if (!json?.ok || !json.data?.userId || !json.data.userProfile) {
      return {
        error:
          json?.error?.message || "Login failed. Check the code and try again.",
      };
    }

    const sb = getAppSupabase();
    if (
      sb &&
      json.data.session?.access_token &&
      json.data.session?.refresh_token
    ) {
      await sb.auth.setSession({
        access_token: json.data.session.access_token,
        refresh_token: json.data.session.refresh_token,
      });
    }

    return {
      error: null,
      userId: json.data.userId,
      profile: json.data.userProfile,
    };
  } catch {
    return { error: "Network error during code login." };
  }
}

/** @deprecated use backendSignInWithOtp */
export async function backendSignInWithPhoneOtp(input: {
  phone: string;
  code: string;
  preferType?: AccountType;
}): Promise<{ error: string | null; profile?: UserProfile; userId?: string }> {
  return backendSignInWithOtp({
    channel: "phone",
    target: input.phone,
    code: input.code,
    preferType: input.preferType,
  });
}

export type BackendSendOtpResult = {
  error: string | null;
  message?: string;
  demoCode?: string;
  /**
   * True when the outcome was genuinely unproven (response lost, nothing
   * conclusive from the ledger). UI must show a neutral outcome and offer
   * a resend never a hard failure.
   */
  maybeSent?: boolean;
};

type OtpSendResponse = {
  ok?: boolean;
  error?: { message?: string };
  data?: { message?: string; demoCode?: string; pending?: boolean };
};

export async function backendSendOtp(
  input: { channel: "phone" | "email"; target: string },
  opts?: { forceResend?: boolean },
): Promise<BackendSendOtpResult> {
  // One sticker per (channel, target). A lost-response retry reuses it so
  // the server replays "already sent" (no second SMS, no code rotation).
  // A deliberate resend (forceResend) clears it so a fresh code goes out.
  const actorId = input.target.trim().toLowerCase();
  const intentKey = `otp|${input.channel}|${actorId}`;
  if (opts?.forceResend) clearIdemKey(intentKey);
  const opKey = getOrCreateIdemKey(intentKey);

  let res: Response | null = null;
  let parsed: OtpSendResponse | null = null;
  try {
    res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: input.channel,
        target: input.target,
        opKey,
        opActorId: actorId,
      }),
    });
    parsed = (await res.json().catch(() => null)) as OtpSendResponse | null;
  } catch {
    /* response lost verify below */
  }

  // Clean server answer (non-ambiguous) trust it.
  const settled = res && parsed ? parsed : null;
  if (settled) {
    if (!settled.ok) {
      return { error: settled.error?.message || "Could not send code." };
    }
    if (settled.data?.pending) {
      // A twin is still settling verify before reporting anything.
      return settleSend(opKey, input.channel, actorId, intentKey);
    }
    clearIdemKey(intentKey);
    return {
      error: null,
      message: settled.data?.message,
      demoCode: settled.data?.demoCode,
    };
  }

  // Lost response find out what actually happened.
  return settleSend(opKey, input.channel, actorId, intentKey);
}

async function settleSend(
  opKey: string | null,
  channel: "phone" | "email",
  actorId: string,
  intentKey: string,
): Promise<BackendSendOtpResult> {
  if (!opKey) {
    // Storage unavailable no sticker means no dedupe; stay neutral.
    return { error: null, maybeSent: true };
  }
  const v = await apiVerifyIdemOp({ opKey, actorKind: channel, actorId });
  if (v.status === "done") {
    // It really went through report success, never "send code again".
    clearIdemKey(intentKey);
    const result = (v.result as { message?: string } | null) || null;
    return { error: null, message: result?.message || "Code sent." };
  }
  if (v.status === "error") {
    return { error: v.error || "Could not send code." };
  }
  // Unproven neutral outcome, offer a resend.
  return { error: null, maybeSent: true };
}

export async function backendSendPhoneOtp(
  phone: string,
): Promise<{ error: string | null; message?: string }> {
  return backendSendOtp({ channel: "phone", target: phone });
}

/** Verify OTP for profile changes (no session created). */
export async function backendProfileVerifyOtp(input: {
  channel: "phone" | "email";
  target: string;
  code: string;
}): Promise<{ error: string | null; verified?: boolean }> {
  try {
    const res = await fetch("/api/auth/otp/profile-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: input.channel,
        target: input.target,
        code: input.code,
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string };
      data?: { verified?: boolean };
    } | null;
    if (!json?.ok || !json.data?.verified) {
      return { error: json?.error?.message || "Verification failed." };
    }
    return { error: null, verified: true };
  } catch {
    return { error: "Network error during verification." };
  }
}

export async function backendSignIn(
  email: string,
  password: string,
): Promise<{
  error: string | null;
  profile?: UserProfile;
  userId?: string;
  hasMotorist?: boolean;
  hasPro?: boolean;
  primaryAccountType?: AccountType;
}> {
  const cleanEmail = email.trim().toLowerCase();

  // Prefer server login (service-role profile + repair) fixes Vercel/RLS login failures
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string };
      data?: {
        userId?: string;
        profile?: UserProfile;
        hasMotorist?: boolean;
        hasPro?: boolean;
        primaryAccountType?: AccountType;
        access_token?: string;
        refresh_token?: string;
      };
    } | null;

    if (json?.ok && json.data?.userId && json.data.profile) {
      const sb = getAppSupabase();
      if (sb && json.data.access_token && json.data.refresh_token) {
        const { error: sessErr } = await sb.auth.setSession({
          access_token: json.data.access_token,
          refresh_token: json.data.refresh_token,
        });
        if (sessErr) {
          console.warn("setSession after login", sessErr.message);
        }
      }
      return {
        error: null,
        profile: json.data.profile,
        userId: json.data.userId,
        hasMotorist: json.data.hasMotorist,
        hasPro: json.data.hasPro,
        primaryAccountType: json.data.primaryAccountType,
      };
    }

    if (json?.error?.message) {
      return { error: json.error.message };
    }
  } catch {
    /* fall through to browser auth */
  }

  // Fallback: pure browser sign-in (local / offline edge cases)
  const sb = getAppSupabase();
  if (!sb) return { error: "Supabase is not configured." };

  const { data, error } = await sb.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) {
      return { error: "Email or password is incorrect." };
    }
    return { error: error.message };
  }
  const userId = data.user?.id;
  if (!userId) return { error: "Login failed." };

  const loaded = await backendLoadUserProfile(userId);
  if (!loaded) {
    return {
      error: "Profile not found after login. Try again or contact support.",
    };
  }
  return { error: null, profile: loaded, userId };
}

/** Smooth Motorist ↔ Repair Pro switch (same user, updates role on server). */
export async function backendSwitchRole(target: AccountType): Promise<{
  error: string | null;
  /** Present when error is needs_signup */
  message?: string;
  profile?: UserProfile;
  userId?: string;
  hasMotorist?: boolean;
  hasPro?: boolean;
  primaryAccountType?: AccountType;
}> {
  const sb = getAppSupabase();
  if (!sb) return { error: "Supabase is not configured." };

  const { ensureAppSession, SESSION_RELOGIN_MESSAGE } =
    await import("@/lib/supabase/session");
  // Wait for storage rehydrate: after navigation / cold start getSession can
  // be empty for a moment, which made the FIRST "Use as" tap fail and only a
  // manual re-tap succeed. The retry worked because the session had rehydrated.
  const session = await ensureAppSession({
    waitForSessionMs: 3000,
    forceRefresh: true,
  });
  const token = session?.accessToken;
  if (!token) return { error: SESSION_RELOGIN_MESSAGE };

  try {
    const res = await fetch("/api/auth/switch-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-access-token": token,
      },
      body: JSON.stringify({
        access_token: token,
        target,
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string; code?: string };
      data?: {
        userId?: string;
        userProfile?: UserProfile;
        hasMotorist?: boolean;
        hasPro?: boolean;
        primaryAccountType?: AccountType;
      };
    } | null;

    if (!json?.ok || !json.data?.userProfile || !json.data.userId) {
      if (json?.error?.code === "needs_signup") {
        return {
          error: "needs_signup",
          message:
            json.error.message ||
            "Sign up for that role first so it saves to the database.",
        };
      }
      return {
        error: json?.error?.message || "Could not switch account type.",
      };
    }

    return {
      error: null,
      profile: json.data.userProfile,
      userId: json.data.userId,
      hasMotorist: json.data.hasMotorist,
      hasPro: json.data.hasPro,
      primaryAccountType: json.data.primaryAccountType,
    };
  } catch {
    return { error: "Network error while switching account." };
  }
}

/** Whether this user has motorist + pro side profiles (for dual switch UI). */
export async function backendDualRoleFlags(
  // userId is kept for callers; the route derives the caller from the
  // session, never a client-supplied id.
  _userId: string,
): Promise<{
  hasMotorist: boolean;
  hasPro: boolean;
  /** Original signup role (earlier side-table), independent of active role */
  primaryAccountType: AccountType;
}> {
  const fallback = {
    hasMotorist: false,
    hasPro: false,
    primaryAccountType: "motorist" as AccountType,
  };
  try {
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch("/api/account/role-flags", {
      method: "GET",
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: {
        hasMotorist?: boolean;
        hasPro?: boolean;
        primaryAccountType?: AccountType;
      };
    } | null;
    if (!json?.ok || !json.data) return fallback;
    return {
      hasMotorist: Boolean(json.data.hasMotorist),
      hasPro: Boolean(json.data.hasPro),
      primaryAccountType: json.data.primaryAccountType || "motorist",
    };
  } catch {
    return fallback;
  }
}

/** Server logout: force is_online=false then clear browser session */
export async function backendLogout(): Promise<void> {
  try {
    const sb = getAppSupabase();
    let access_token: string | undefined;
    let userId: string | undefined;
    if (sb) {
      const { data } = await sb.auth.getSession();
      access_token = data.session?.access_token;
      userId = data.session?.user?.id;
    }
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token, userId }),
    }).catch(() => null);
  } catch {
    /* ignore */
  }
  await backendSignOut();
}

export async function backendSignOut(): Promise<void> {
  const sb = getAppSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function backendGetSessionUserId(): Promise<string | null> {
  const sb = getAppSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function backendLoadUserProfile(
  // userId is kept for callers; the route derives the caller from the
  // session only -- not even as a cross-check -- since this returns bank
  // details, NIN/BVN, gov-ID and guarantor info.
  _userId: string,
): Promise<UserProfile | null> {
  try {
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch("/api/profile", {
      method: "GET",
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: { profile?: UserProfile | null };
    } | null;
    if (!json?.ok) return null;
    return json.data?.profile ?? null;
  } catch {
    return null;
  }
}

export async function backendFetchPros(
  userCoords: {
    lat: number;
    lng: number;
  },
  // opts.trade is unused: /api/pros derives the pro's trade from the
  // session, not a client-supplied param.
  _opts?: { trade?: ProService | null },
): Promise<Technician[]> {
  // Server route (service role): applies tier/suspension/synthetic-account
  // filtering and dual-role self-exclusion. No direct-query fallback — a
  // client-side fallback here would need to re-derive all of that itself
  // and could drift from the server's rules (e.g. widen a pro's market).
  try {
    const qs = new URLSearchParams({
      lat: String(userCoords.lat),
      lng: String(userCoords.lng),
    });
    // authFetch so server can exclude the signed-in dual-role user from results
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch(`/api/pros?${qs.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: { technicians?: Technician[] };
    } | null;
    if (json?.ok && Array.isArray(json.data?.technicians)) {
      return json.data.technicians;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Go Live / Away with GPS. Uses server route so role + pin always stick
 * (service role), then motorists can discover within 5 km / 2 km docs.
 */
export async function backendSetProOnline(
  userId: string,
  online: boolean,
  coords?: { lat: number; lng: number },
): Promise<string | null> {
  const { ensureAppSession, SESSION_RELOGIN_MESSAGE } =
    await import("@/lib/supabase/session");

  type LiveJson = {
    ok?: boolean;
    error?: { message?: string; code?: string };
    data?: { online?: boolean; pro?: { is_online?: boolean } };
  } | null;

  const callLive = async (
    uid: string,
    access_token?: string,
  ): Promise<LiveJson> => {
    const res = await fetch("/api/pros/live", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(access_token
          ? {
              Authorization: `Bearer ${access_token}`,
              "x-access-token": access_token,
            }
          : {}),
      },
      body: JSON.stringify({
        userId: uid,
        access_token,
        online,
        lat: coords?.lat,
        lng: coords?.lng,
      }),
    });
    return (await res.json().catch(() => null)) as LiveJson;
  };

  try {
    // Refresh near-expiry tokens before Go Live / Away
    let session = await ensureAppSession();
    const uid = session?.userId || userId;

    let json = await callLive(uid, session?.accessToken);

    // Retry once after forced refresh + userId-only fallback (no hard “session expired”)
    if (
      !json?.ok &&
      (json?.error?.code === "session_expired" ||
        json?.error?.code === "auth_required" ||
        /session|sign in|log in again/i.test(json?.error?.message || ""))
    ) {
      session = await ensureAppSession({ refreshIfExpiresWithinMs: 3_600_000 });
      json = await callLive(session?.userId || uid, session?.accessToken);
      if (!json?.ok) {
        // Service-role path with userId only Go Live must not die on stale JWT
        json = await callLive(uid, undefined);
      }
    }

    if (!json?.ok) {
      const msg = json?.error?.message || "Could not update Live status";
      if (/session expired/i.test(msg)) return SESSION_RELOGIN_MESSAGE;
      return msg;
    }
    if (online === false && json.data?.pro?.is_online === true) {
      return "Could not go Away on server. Try again.";
    }
    return null;
  } catch (e) {
    // No direct-write fallback: /api/pros/live also gates tier/suspension/GPS,
    // upserts pro_presence for customer discovery, recalculates merit and
    // reroutes unbooked jobs on going offline. A bypass here would silently
    // skip all of that instead of surfacing the failure.
    return e instanceof Error ? e.message : "Could not update Live status";
  }
}

/** Read Live flag from server (sync dashboard UI). */
export async function backendGetProOnline(
  // userId is kept for callers; the route derives the caller from the
  // session, never a client-supplied id.
  _userId: string,
): Promise<boolean | null> {
  try {
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch("/api/pros/live", {
      method: "GET",
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: { online?: boolean | null };
    } | null;
    if (!json?.ok) return null;
    return typeof json.data?.online === "boolean" ? json.data.online : null;
  } catch {
    return null;
  }
}

/**
 * Create a job via the premium API (flow_status + pro notification).
 * Direct Supabase insert was missing negotiating state and never notified pros.
 */
export async function backendCreateJob(input: {
  motoristId: string;
  repairProId: string;
  serviceType: ProService;
  description: string;
  lat: number;
  lng: number;
  address: string;
  radiusKm: number;
  motoristName?: string;
  motoristPhoto?: string | null;
  repairProName?: string;
  repairProPhoto?: string;
  proBaseMajor?: number | null;
  currency?: string;
}): Promise<{ error: string | null; request?: ServiceRequest }> {
  try {
    const { apiCreateJob } = await import("@/lib/jobs/client");
    const res = await apiCreateJob({
      motoristId: input.motoristId,
      motoristName: input.motoristName || "Customer",
      motoristPhoto: input.motoristPhoto ?? null,
      repairProId: input.repairProId,
      repairProName: input.repairProName || "Repair Pro",
      repairProPhoto: input.repairProPhoto,
      serviceType: input.serviceType,
      problem: input.description,
      currency: input.currency || "NGN",
      proBaseMajor: input.proBaseMajor ?? null,
      locationLabel: input.address || "Near you",
      lat: input.lat,
      lng: input.lng,
    });
    if (!res.ok) {
      return { error: res.message || "Could not create job" };
    }
    const job = res.data.job;
    // Map JobRecord → ServiceRequest shape used by store
    const request: ServiceRequest = {
      id: job.id,
      technicianId: job.repairProId,
      technicianName: job.repairProName,
      serviceType: job.serviceType as ProService,
      problem: job.problem,
      status: "pending",
      createdAt: job.createdAt,
      locationLabel: job.locationLabel || "Near you",
      labourBaseMajor: job.proBaseMajor ?? undefined,
      labourAgreedMajor: job.agreedMajor ?? undefined,
      pricingCurrency: job.currency,
      negotiationStatus: "none",
      motoristId: job.motoristId,
      etaMinutes: job.etaMinutes ?? 0,
      distanceKm: job.distanceKm ?? 0,
    };
    return { error: null, request };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not create job",
    };
  }
}

export async function backendFetchJobsForUser(
  userId: string,
  role: AccountType,
  diagnostic?: DiagnosticContext,
): Promise<ServiceRequest[]> {
  try {
    const qs = new URLSearchParams({ userId, role });
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch(`/api/requests?${qs.toString()}`, {
      method: "GET",
      cache: "no-store",
    }, diagnostic);
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: { requests?: ServiceRequest[] };
    } | null;
    if (!json?.ok || !Array.isArray(json.data?.requests)) return [];
    return json.data.requests;
  } catch {
    return [];
  }
}

export async function backendEnsureConversation(input: {
  requestId: string;
  /** Kept for callers; the route derives both party ids from the
   * service_requests row itself, never from client input. */
  motoristId: string;
  repairProId: string;
}): Promise<{ error: string | null; conversationId?: string }> {
  try {
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch("/api/conversations/ensure", {
      method: "POST",
      body: JSON.stringify({ requestId: input.requestId }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: { conversationId?: string };
      error?: { message?: string };
    } | null;
    if (!json?.ok) {
      return { error: json?.error?.message || "Chat create failed" };
    }
    return { error: null, conversationId: json.data?.conversationId };
  } catch {
    return { error: "Network error starting chat" };
  }
}

export async function backendFetchConversations(
  userId: string,
  role: AccountType,
): Promise<MessageThread[]> {
  try {
    const qs = new URLSearchParams({ userId, role });
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch(`/api/conversations?${qs.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: { threads?: MessageThread[] };
    } | null;
    if (!json?.ok || !Array.isArray(json.data?.threads)) return [];
    return json.data.threads;
  } catch {
    return [];
  }
}

export async function backendSendMessage(input: {
  conversationId: string;
  /** Kept for callers; the route derives the sender from the auth session, not this field. */
  senderId: string;
  body: string;
  /** Display name for the other party's toast */
  senderName?: string | null;
}): Promise<string | null> {
  const { authFetch } = await import("@/lib/api-auth-headers");
  try {
    const res = await authFetch("/api/messages/send", {
      method: "POST",
      body: JSON.stringify({
        conversationId: input.conversationId,
        body: input.body,
        senderName: input.senderName || undefined,
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string };
    } | null;
    if (!json?.ok) return json?.error?.message || "Message not sent";
    return null;
  } catch {
    return "Network error sending message";
  }
}

/**
 * Realtime: any new message in conversations this user belongs to.
 * Used to refresh chats + drive inbound banner when not on the thread page.
 */
export function backendSubscribeUserMessageInserts(
  userId: string,
  onInsert: (row: MessageRow & { conversation_id?: string }) => void,
): (() => void) | null {
  const sb = getAppSupabase();
  if (!sb || !userId) return null;
  const channel = sb
    .channel(
      `user-messages:${userId}:${Math.random().toString(36).slice(2, 8)}`,
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const row = payload.new as MessageRow & {
          conversation_id?: string;
          sender_id?: string;
        };
        // Ignore own sends (sender already has optimistic UI)
        if (row.sender_id === userId) return;
        onInsert(row);
      },
    )
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}

/** Mark other party's messages as read in this conversation. */
export async function backendMarkMessagesRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  if (!conversationId || conversationId.startsWith("chat-") || !userId) return;
  try {
    const { authFetch } = await import("@/lib/api-auth-headers");
    await authFetch("/api/messages/read", {
      method: "POST",
      body: JSON.stringify({ conversationId, userId }),
    });
  } catch {
    /* ignore */
  }
}

/** Subscribe to new messages in a conversation (Realtime). */
export function backendSubscribeMessages(
  conversationId: string,
  onInsert: (row: MessageRow) => void,
): (() => void) | null {
  const sb = getAppSupabase();
  if (!sb) return null;
  const channel = sb
    .channel(
      `messages:${conversationId}:${Math.random().toString(36).slice(2, 8)}`,
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onInsert(payload.new as MessageRow);
      },
    )
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}

/**
 * Job Realtime filtered to this user’s rows only.
 * OLD BUG: subscribed to *all* service_requests → every pro GPS/status in the
 * whole app triggered a full jobs refetch for every client (huge data waste).
 */
export function backendSubscribeJobs(
  userId: string,
  onChange: (payload?: {
    new?: Record<string, unknown>;
    old?: Record<string, unknown>;
  }) => void,
  source: JobSource = "other",
): (() => void) | null {
  const sb = getAppSupabase();
  const context = { source, trigger: "realtime" as const };
  if (!sb) {
    recordJobDiagnostic("subscription", "jobs", context, "unavailable");
    return null;
  }
  recordJobDiagnostic("subscription", "jobs", context, "opened");
  const channel = sb
    .channel(`jobs:${userId}:${Math.random().toString(36).slice(2, 8)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "service_requests",
        filter: `motorist_id=eq.${userId}`,
      },
      (
        payload: {
          new?: Record<string, unknown>;
          old?: Record<string, unknown>;
        } | null,
      ) => {
        recordJobDiagnostic("subscription", "jobs", context, "event");
        onChange(payload || undefined);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "service_requests",
        filter: `repair_pro_id=eq.${userId}`,
      },
      (
        payload: {
          new?: Record<string, unknown>;
          old?: Record<string, unknown>;
        } | null,
      ) => {
        recordJobDiagnostic("subscription", "jobs", context, "event");
        onChange(payload || undefined);
      },
    )
    .subscribe((status) => {
      const outcome = { SUBSCRIBED: "subscribed", CHANNEL_ERROR: "channel-error", TIMED_OUT: "timeout", CLOSED: "closed" } as const;
      if (status in outcome) recordJobDiagnostic("subscription", "jobs", context, outcome[status]);
    });
  return () => {
    recordJobDiagnostic("subscription", "jobs", context, "removed");
    void sb.removeChannel(channel);
  };
}

export type ProPresenceChangeReason = "presence" | "heartbeat";

/**
 * Pros Live presence Realtime for the customer marketplace.
 *
 * Subscribes to `pro_presence` (public, non-sensitive). The old
 * `repair_pro_profiles` channel never delivered other pros' rows to motorists
 * because RLS is own-row-only so Live never appeared without a full refresh.
 *
 * - Live/Away flips → immediate `presence` callback (no 60s throttle)
 * - GPS heartbeats → `heartbeat` at most ~every 25s
 */
export function backendSubscribePros(
  onChange: (reason?: ProPresenceChangeReason) => void,
): (() => void) | null {
  if (typeof window === "undefined") return null;
  const sb = getAppSupabase();
  if (!sb) return null;

  let lastPresenceFire = 0;
  let lastHeartbeatFire = 0;

  type PresenceRow = {
    user_id?: string;
    is_online?: boolean;
    lat?: number | null;
    lng?: number | null;
    location_updated_at?: string | null;
  };

  const handle = (payload: {
    eventType?: string;
    new?: PresenceRow;
    old?: PresenceRow;
  }) => {
    const neu = payload.new;
    const old = payload.old;
    if (!neu && payload.eventType !== "DELETE") return;

    const onlineNow = Boolean(neu?.is_online);
    const onlineWas =
      old && typeof old.is_online === "boolean" ? old.is_online : null;
    const flipped =
      payload.eventType === "INSERT" ||
      payload.eventType === "DELETE" ||
      onlineWas === null ||
      onlineWas !== onlineNow;

    const now = Date.now();
    if (flipped) {
      // Coalesce double Live events within 400ms, never block for 60s
      if (now - lastPresenceFire < 400) return;
      lastPresenceFire = now;
      onChange("presence");
      return;
    }

    // Location/heartbeat only keep map pins fresh without hammering /api/pros
    if (now - lastHeartbeatFire < 25_000) return;
    lastHeartbeatFire = now;
    onChange("heartbeat");
  };

  const channelName = `pros-presence:${Math.random().toString(36).slice(2, 8)}`;
  const sub = sb
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pro_presence",
      },
      (payload) => {
        handle({
          eventType: payload.eventType,
          new: (payload.new || undefined) as PresenceRow | undefined,
          old: (payload.old || undefined) as PresenceRow | undefined,
        });
      },
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("[ona] pro_presence Realtime:", status);
      }
    });

  return () => {
    void sb.removeChannel(sub);
  };
}
