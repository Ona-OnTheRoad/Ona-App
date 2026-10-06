import type { UserLocation } from "@/lib/types";

/**
 * App-wide map fallback when GPS is denied/unavailable and no last-known fix.
 * Neutral Lagos corridor coords only never a business name.
 * Live GPS / last-known / manual pin override this immediately.
 * (1st Price Furniture is search-suggestion only, not a location label.)
 *
 * Kept in its own tiny module (not data/technicians.ts) so the app shell can import it
 * without pulling the technician seed data into every page's first load.
 */
export const DEFAULT_USER_LOCATION: UserLocation = {
  label: "Lagos, Nigeria",
  city: "Lagos",
  coordinates: { lat: 6.5244, lng: 3.3792 },
};

/** localStorage key for last successful GPS fix */
export const LAST_GPS_KEY = "ona-last-gps";
