import type { JobFlowStatus, JobOffer, JobRecord } from "@/lib/jobs/types";

export function stepTitle(s: JobFlowStatus, isPro: boolean): string {
  switch (s) {
    case "negotiating":
      return isPro ? "Request received" : "Request sent";
    case "agreed":
      return "Price accepted";
    case "paid_booked":
      return "Paid & booked";
    case "en_route":
      return isPro ? "Trip started · on the road" : "Pro en route";
    case "arrived":
      return "Arrived on site";
    case "in_progress":
      return "Work in progress";
    case "completed":
      return "Work marked complete";
    case "satisfied":
      return "Customer confirmed satisfaction";
    case "released":
      return "Payment released";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Negotiation expired";
    case "disputed":
      return "Dispute opened";
    case "under_appeal":
      return "Under appeal";
    case "refunded":
      return "Refunded";
    default:
      return String(s).replace(/_/g, " ");
  }
}

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
    default:
      return String(s).replace(/_/g, " ");
  }
}

export function historyAt(
  job: JobRecord,
  status: JobFlowStatus | JobFlowStatus[],
): string | null {
  const want = Array.isArray(status) ? status : [status];
  const hits = (job.statusHistory || []).filter((h) => want.includes(h.status));
  if (!hits.length) return null;
  hits.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return hits[hits.length - 1]?.at ?? null;
}

export function hasReached(job: JobRecord, status: JobFlowStatus): boolean {
  if (job.status === status) return true;
  return (job.statusHistory || []).some((h) => h.status === status);
}

export function offerSideLabel(side: JobOffer["side"], isPro: boolean): string {
  if (side === "repair_pro") return isPro ? "You" : "Repair Pro";
  return isPro ? "Customer" : "You";
}
