import type { JobFlowStatus } from "@/lib/jobs/types";

/** Pro past / closed only full process on /requests/[id] */
export const PRO_PAST = new Set<JobFlowStatus>([
  "completed",
  "satisfied",
  "released",
  "cancelled",
  "expired",
  "disputed",
  "under_appeal",
  "refunded",
]);

export function statusLabel(s: JobFlowStatus): string {
  switch (s) {
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
    case "negotiating":
      return "Service Request";
    case "agreed":
      return "Agreed";
    case "paid_booked":
      return "Booked";
    case "en_route":
      return "On the road";
    case "arrived":
      return "Arrived";
    case "in_progress":
      return "Working";
    default:
      return String(s).replace(/_/g, " ");
  }
}

export function formatWhen(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  try {
    return new Date(t).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
