import type { Coordinates } from "./location";
import type { ProService } from "./services";

export type AvailabilityStatus = "available" | "busy" | "nearby" | "offline";

export interface Technician {
  id: string;
  name: string;
  shortName: string;
  serviceType: ProService;
  roleLabel: string;
  photo: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  etaMinutes: number;
  status: AvailabilityStatus;
  verified: boolean;
  fastResponse: boolean;
  specialties: string[];
  description: string;
  phone: string;
  serviceRadiusKm: number;
  location: Coordinates;
  /** True when lat/lng come from the pro’s live pin (not a fallback) */
  hasLiveLocation?: boolean;
  markerLabel?: string;
  responseSpeedScore: number;
  currentLoad: number;
  /** Service focus vehicles this pro serves (motorist-visible) */
  servedVehicleType?: string;
  servedBrand?: string;
  servedMake?: string;
  servedModel?: string;
  servedCountry?: string;
  servedLocation?: string;
  businessName?: string;
  yearsExperience?: string;
  bio?: string;
  /**
   * Certification / trade docs review.
   * under_review → public discovery limited to 2 km until approved.
   */
  docsStatus?: "none" | "under_review" | "approved" | "rejected";
  docsRatingBoostApplied?: boolean;
  /** Jobs completed (for achievement badges) */
  jobsCompleted?: number;
  /** New Artisan badge lower ranking (Tier 1-2) */
  isNewArtisan?: boolean;
  /** Admin visibility ladder 1-4 */
  visibilityTier?: 1 | 2 | 3 | 4;
  /** 0-100 marketplace weight */
  visibilityPercent?: number;
  servicePrices?: Partial<Record<ProService, number | string>>;
  pricingCurrency?: import("@/lib/pricing").AppCurrency;
  skillAnswers?: Record<
    string,
    | string
    | string[]
    | { name: string; dataUrl?: string; mime?: string; hasFile?: boolean }
  >;
}
