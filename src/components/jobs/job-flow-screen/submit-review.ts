import { apiRateJob } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import { REVIEW_MAX } from "./constants";
import type { JobViewer } from "./types";

interface Deps {
  job: JobRecord;
  viewer: JobViewer;
  rating: number;
  reviewText: string;
  setErr: (v: string | null) => void;
  setBusy: (v: boolean) => void;
  setReviewLeft: (v: boolean) => void;
  setFlash: (v: string | null) => void;
  commitJob: (next: JobRecord, force?: boolean) => void;
}

/** Builds the customer's "Submit review" handler. */
export function createSubmitReview({
  job,
  viewer,
  rating,
  reviewText,
  setErr,
  setBusy,
  setReviewLeft,
  setFlash,
  commitJob,
}: Deps) {
  return async () => {
    if (viewer !== "motorist") return;
    if (!rating || rating < 1) {
      setErr("Tap a star rating first");
      return;
    }
    setBusy(true);
    setErr(null);
    const note = reviewText.trim().slice(0, REVIEW_MAX);
    // Save job-level rating (existing)
    const res = await apiRateJob({
      jobId: job.id,
      rating,
      note: note || undefined,
      actor: "motorist",
    });
    if (!res.ok) {
      setBusy(false);
      setErr(res.message || "Could not save review");
      return;
    }
    commitJob(res.data.job, true);
    // rateJob server path already publishes pro profile review aggregates.
    // Do not dual-write /api/reviews here (diverged stats).
    setReviewLeft(true);
    setFlash("Thanks for your review");
    window.setTimeout(() => setFlash(null), 2500);
    setBusy(false);
    try {
      const { playAppSound } = await import("@/lib/sound-tone");
      playAppSound("job_complete");
    } catch {
      /* */
    }
  };
}
