import type { Technician, UserLocation } from "@/lib/types";
import { TECHNICIANS_PART_1 } from "./technicians/part-1";
import { TECHNICIANS_PART_2 } from "./technicians/part-2";
import { TECHNICIANS_PART_3 } from "./technicians/part-3";
import { TECHNICIANS_PART_4 } from "./technicians/part-4";
import { TECHNICIANS_PART_5 } from "./technicians/part-5";
import { TECHNICIANS_PART_6 } from "./technicians/part-6";

/**
 * App-wide map fallback when GPS is denied/unavailable and no last-known fix.
 * Neutral Lagos corridor coords only never a business name.
 * Live GPS / last-known / manual pin override this immediately.
 * (1st Price Furniture is search-suggestion only, not a location label.)
 */
export const DEFAULT_USER_LOCATION: UserLocation = {
  label: "Lagos, Nigeria",
  city: "Lagos",
  coordinates: { lat: 6.5244, lng: 3.3792 },
};

/** localStorage key for last successful GPS fix */
export const LAST_GPS_KEY = "ona-last-gps";

/** Pros within ~5 km (includes nearby fashion designers for Fashion tab) */
export const TECHNICIANS: Technician[] = [
  ...TECHNICIANS_PART_1,
  ...TECHNICIANS_PART_2,
  ...TECHNICIANS_PART_3,
  ...TECHNICIANS_PART_4,
  ...TECHNICIANS_PART_5,
  ...TECHNICIANS_PART_6,
];

export {
  INITIAL_REQUESTS,
  INITIAL_BOOKINGS,
  INITIAL_MESSAGES,
} from "./technicians/initial-state";
export { PROBLEM_MATCHES } from "./technicians/problem-matches";
