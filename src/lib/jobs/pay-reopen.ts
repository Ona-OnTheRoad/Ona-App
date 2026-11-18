import { PAY_HISTORY } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";

/**
 * Can a job that is no longer "agreed" be put back to "agreed" so the customer
 * can pay it? Only when the customer simply ran out of time to pay
 * (the unpaid-booking expiry), never because someone CANCELLED it.
 *
 * It used to allow any cancelled job with an agreed price, so when the Repair
 * Pro cancelled, the customer still got a working "Finish payment" prompt and a
 * payment would resurrect the job the Pro had walked away from.
 */
export function canReopenForPayment(
  job: Pick<JobRecord, "status" | "statusHistory" | "escrowStatus">,
): boolean {
  if (job.status !== "expired") return false;
  if (
    job.escrowStatus === "held" ||
    job.escrowStatus === "released" ||
    job.escrowStatus === "release_pending"
  ) {
    return false;
  }
  const history = job.statusHistory ?? [];
  if (history.some((h) => h.by === PAY_HISTORY.MAX_ATTEMPTS_CANCEL)) return false;
  // The entry that closed it must be the unpaid-booking expiry.
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (h.status === "expired" || h.status === "cancelled") {
      return h.by === PAY_HISTORY.UNPAID_BOOK_EXPIRE;
    }
  }
  return false;
}

/** Who cancelled it, for the customer-facing message. */
export function cancelledByLabel(
  job: Pick<JobRecord, "statusHistory">,
): "pro" | "customer" | "other" {
  const history = job.statusHistory ?? [];
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (h.status === "cancelled") {
      if (h.by === "repair_pro") return "pro";
      if (h.by === "motorist") return "customer";
      return "other";
    }
  }
  return "other";
}
