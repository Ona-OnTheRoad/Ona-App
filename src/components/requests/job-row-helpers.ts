import type { JobFlowStatus, JobRecord } from "@/lib/jobs/types";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import { PRO_SERVICE_LABELS } from "@/lib/services";

export const PAST_STATUSES: JobFlowStatus[] = [
  "completed",
  "satisfied",
  "released",
  "cancelled",
  "expired",
  "disputed",
  "under_appeal",
  "refunded",
];

export function jobRowStatusLabel(s: JobFlowStatus, isPro: boolean): string {
  switch (s) {
    case "scheduled":
      return "Scheduled";
    case "waiting_for_selected":
    case "selected_review":
      return isPro ? "Service Request" : "Finding a pro";
    case "sequential_pairing":
      return isPro ? "Service Request" : "Finding a pro";
    case "waiting_for_pro":
    case "reserved":
      return isPro ? "Service Request" : "Repair Pro reviewing";
    case "negotiating":
      return isPro ? "Service Request" : "Negotiating";
    case "agreed":
      return "Agreed";
    case "paid_booked":
      return "Booked";
    case "en_route":
      return "OnTheRoad";
    case "arrived":
      return "Arrived";
    case "in_progress":
      return "Working";
    case "completed":
      return "Completed";
    case "satisfied":
    case "released":
      return "Finished";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    case "disputed":
      return "Disputed";
    case "under_appeal":
      return "Under appeal";
    case "refunded":
      return "Refunded";
    default:
      return String(s).replace(/_/g, " ");
  }
}

/** Pro: no customer full name, vehicle + issues only. */
export function jobRowName(j: JobRecord, isPro: boolean): string {
  return isPro
    ? isAutomotiveTrade(j.serviceType) && j.motoristVehicle?.trim()
      ? j.motoristVehicle.trim()
      : j.motoristName?.split(/\s+/)[0] ||
        PRO_SERVICE_LABELS[j.serviceType] ||
        "Service Request"
    : j.repairProName;
}

export function jobRowSkill(j: JobRecord): string {
  return PRO_SERVICE_LABELS[j.serviceType] ?? j.serviceType;
}

export function sortByRecent(jobs: JobRecord[]): JobRecord[] {
  return jobs.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime(),
  );
}
