import type { JobRecord } from "@/lib/jobs/types";

/** Labels that are pro GPS noise, not motorist meet address */
export function isGenericLocation(label: string): boolean {
  const t = label.trim().toLowerCase();
  if (!t) return true;
  return (
    t === "current location" ||
    t === "locating…" ||
    t === "locating..." ||
    t === "near you" ||
    t === "last known location" ||
    t === "live location" ||
    t === "pinned location" ||
    t === "pinned"
  );
}

export function meetAddress(j: JobRecord): string | null {
  const raw = (j.locationLabel || "").trim();
  if (!raw || isGenericLocation(raw)) return null;
  return raw;
}
