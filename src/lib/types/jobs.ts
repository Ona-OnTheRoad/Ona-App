import type { Coordinates } from "./location";
import type { ProService } from "./services";

export type RequestStatus =
  | "pending"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ServiceRequest {
  id: string;
  /** Durable service_requests row revision; not a revision of profile data. */
  jobVersion?: number;
  technicianId: string;
  technicianName: string;
  /** Supabase motorist profile id when job is cloud-backed */
  motoristId?: string;
  serviceType: ProService;
  problem: string;
  status: RequestStatus;
  createdAt: string;
  etaMinutes: number;
  distanceKm: number;
  locationLabel: string;
  /** Motorist is booking help for another person at this meet point */
  bookingForSomeoneElse?: boolean;
  meetCoordinates?: Coordinates;
  /** Labour pricing snapshot (escrow) */
  pricingCurrency?: import("@/lib/pricing").AppCurrency;
  labourBaseMajor?: number;
  labourAgreedMajor?: number;
  discountPercent?: number;
  negotiationStatus?: "none" | "pending_pro" | "accepted" | "declined" | "paid";
  paymentId?: string;
  paymentReference?: string;
  escrowStatus?: string;
}

export interface Booking {
  id: string;
  technicianName: string;
  serviceType: ProService;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  locationLabel: string;
}

export interface AppFilters {
  nearest: boolean;
  rating45: boolean;
  availableNow: boolean;
  verified: boolean;
  fastResponse: boolean;
}
