export type VehiclePickerKey = "vehicleType" | "make" | "model" | "year";

/**
 * Account signup: trade → specialty → vehicles you fix → about → contact → area → review.
 * Profession-specific questions: /artisan/onboarding.
 */
export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const FLOW_STEPS: Step[] = [1, 2, 3, 4, 5, 6, 7];

/** Actual years of service 1-9, then 10+ */
export const EXP_YEARS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10+",
] as const;
export const BIO_MAX = 144;
export const MAX_BRANDS = 2;

export function experienceLabel(value: string) {
  if (value === "10+") return "10+ yrs";
  if (value === "1") return "1 yr";
  return `${value} yrs`;
}

export const isAny = (v: string) => !v || v === "Any";

export const displayVal = (v: string) => (isAny(v) ? "ANY" : v.toUpperCase());
