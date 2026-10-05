import { DEFAULT_USER_LOCATION, LAST_GPS_KEY } from "@/lib/data/technicians";
import { isProService } from "@/lib/pro-service-id";
import type {
  AccountType,
  RegisteredAs,
  ServiceCategory,
  UserLocation,
} from "@/lib/types";
import {
  CATEGORY_VALUES,
  DEVICE_THEME_KEY,
  PRIMARY_ACCOUNT_KEY,
} from "./constants";
import type { AppTheme } from "./types";

export function readStoredPrimaryAccount(): AccountType | null {
  try {
    const v = localStorage.getItem(PRIMARY_ACCOUNT_KEY);
    if (v === "motorist" || v === "professional") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredPrimaryAccount(type: AccountType) {
  try {
    localStorage.setItem(PRIMARY_ACCOUNT_KEY, type);
  } catch {
    /* ignore */
  }
}

export function isRegisteredAs(v: string | null): v is RegisteredAs {
  return v === "client" || (v != null && isProService(v));
}

export function systemTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const themeKeyForUser = (userId: string | null | undefined) =>
  userId ? `ona-theme-user-${userId}` : DEVICE_THEME_KEY;

export const isCategory = (v: unknown): v is ServiceCategory =>
  typeof v === "string" && (CATEGORY_VALUES as string[]).includes(v);

/** Last known GPS fix from localStorage (client only), else the default pin. */
export function readInitialLocation(): UserLocation {
  if (typeof window === "undefined") return DEFAULT_USER_LOCATION;
  try {
    const raw = localStorage.getItem(LAST_GPS_KEY);
    if (!raw) return DEFAULT_USER_LOCATION;
    const p = JSON.parse(raw) as {
      lat?: number;
      lng?: number;
      label?: string;
      city?: string;
    };
    if (
      typeof p.lat === "number" &&
      typeof p.lng === "number" &&
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng) &&
      Math.abs(p.lat) > 0.1 &&
      Math.abs(p.lng) > 0.1
    ) {
      return {
        label: p.label || "Last known location",
        city: p.city || "",
        coordinates: { lat: p.lat, lng: p.lng },
      };
    }
  } catch {
    /* */
  }
  return DEFAULT_USER_LOCATION;
}
