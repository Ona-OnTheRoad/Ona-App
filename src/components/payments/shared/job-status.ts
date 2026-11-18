import type { JobRecord } from "@/lib/jobs/types";

/** Pay is confirmed and the job is booked / underway (poll + verify exit). */
export function isBookedOrActiveStatus(st: string | undefined): boolean {
  return (
    st === "paid_booked" ||
    st === "en_route" ||
    st === "arrived" ||
    st === "in_progress"
  );
}

/** Already paid: leave checkout and open the live job. */
export function isPaidOrLiveStatus(st: string | undefined): boolean {
  return (
    st === "paid_booked" ||
    st === "en_route" ||
    st === "arrived" ||
    st === "in_progress" ||
    st === "completed" ||
    st === "satisfied" ||
    st === "released"
  );
}

/**
 * agreed, or expired because the customer ran out of time to pay (the server
 * re-opens it to agreed + a new pay link, and decides precisely). A CANCELLED
 * job is never payable: if the Repair Pro cancels, the customer must not be
 * offered "Finish payment".
 */
export function isJobPayable(
  job: Pick<JobRecord, "status" | "agreedMajor">,
): boolean {
  return (
    job.status === "agreed" ||
    (job.status === "expired" && job.agreedMajor != null && job.agreedMajor > 0)
  );
}
