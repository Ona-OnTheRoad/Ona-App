import type { Technician } from "@/lib/types";
import { TECHNICIANS_PART_1 } from "./technicians/part-1";
import { TECHNICIANS_PART_2 } from "./technicians/part-2";
import { TECHNICIANS_PART_3 } from "./technicians/part-3";
import { TECHNICIANS_PART_4 } from "./technicians/part-4";
import { TECHNICIANS_PART_5 } from "./technicians/part-5";
import { TECHNICIANS_PART_6 } from "./technicians/part-6";

export { DEFAULT_USER_LOCATION, LAST_GPS_KEY } from "./user-location";

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
