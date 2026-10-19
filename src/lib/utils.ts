import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Knows the Ona v2 radius tokens (globals.css @theme) so they override rounded-md etc. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ["ona-ctl", "ona-card", "ona-sheet"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** First token of a full name (e.g. "Oluwatosin Temitope" → "Oluwatosin") */
export function firstNameOnly(
  full: string | null | undefined,
  fallback = "Customer",
): string {
  const t = String(full || "").trim();
  if (!t) return fallback;
  const first = t.split(/\s+/)[0];
  return first || fallback;
}

export function kmToMeters(km: number) {
  return km * 1000;
}

export function formatDistance(km: number) {
  if (km < 0.1) return "< 0.1 km";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatEta(minutes: number) {
  if (minutes < 1) return "< 1 min";
  return `${Math.round(minutes)} min`;
}
