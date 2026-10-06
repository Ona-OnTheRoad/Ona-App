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

/** agreed | cancelled | expired with price → server re-opens to agreed + new pay link. */
export function isJobPayable(
  job: Pick<JobRecord, "status" | "agreedMajor">,
): boolean {
  return (
    job.status === "agreed" ||
    ((job.status === "cancelled" || job.status === "expired") &&
      job.agreedMajor != null &&
      job.agreedMajor > 0)
  );
}
