import { apiGetJob, apiTransition } from "@/lib/jobs/client";
import { isPayoutPendingSettlement } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";

/** True once the server shows the release as done or in flight. */
function isReleaseSettled(j: JobRecord): boolean {
  return Boolean(
    j.status === "released" ||
    j.status === "satisfied" ||
    j.releasedAt ||
    j.escrowStatus === "released" ||
    j.escrowStatus === "pending_settlement" ||
    j.escrowStatus === "release_pending",
  );
}

interface Deps {
  job: JobRecord;
  motoristActor: string;
  setErr: (v: string | null) => void;
  setStickyReleaseErr: (v: string | null) => void;
  setBusy: (v: boolean) => void;
  commitJob: (next: JobRecord, force?: boolean) => void;
  applyJob: (j: JobRecord) => void;
}

/** Builds the swipe-to-release ("I'm satisfied") handler for the customer. */
export function createSatisfiedHandler({
  job,
  motoristActor,
  setErr,
  setStickyReleaseErr,
  setBusy,
  commitJob,
  applyJob,
}: Deps) {
  return () => {
    if (!motoristActor) {
      const msg =
        "Sign in as the customer who booked this job to release payment.";
      setErr(msg);
      setStickyReleaseErr(msg);
      return;
    }
    setBusy(true);
    setErr(null);
    // Optimistic: flip to pending_settlement instantly so the 6h auto-release
    // countdown and the static “Confirming…” disappear at swipe time. The
    // server is the source of truth; the re-fetch below reconciles (and on a
    // real hard failure the screen flips back to completed with the error).
    commitJob(
      {
        ...job,
        status: "satisfied",
        escrowStatus: "pending_settlement",
        satisfiedAt: new Date().toISOString(),
      },
      true,
    );
    // Keep previous sticky until we know result
    void (async () => {
      try {
        const res = await apiTransition({
          jobId: job.id,
          event: "SATISFIED",
          actor: "motorist",
          actorId: motoristActor,
        });
        // Always re-fetch release may have finished even if the response raced.
        try {
          const again = await apiGetJob(job.id, { source: "job-action", trigger: "retry" });
          if (again.ok && again.data.job) {
            commitJob(again.data.job, true);
            if (!res.ok) {
              const j = again.data.job;
              if (isReleaseSettled(j)) {
                setStickyReleaseErr(null);
                setErr(null);
                applyJob(j);
                try {
                  const { playAppSound } = await import("@/lib/sound-tone");
                  playAppSound("success_soft");
                } catch {
                  /* */
                }
                // Stay on job → review screen (do not bounce to dashboard).
                return;
              }
            }
          }
        } catch {
          /* */
        }
        if (!res.ok) {
          const msg =
            res.message ||
            "Could not release payment. Funds stay held. Fix bank details or contact support.";
          setErr(msg);
          setStickyReleaseErr(msg);
          try {
            const { playAppSound } = await import("@/lib/sound-tone");
            playAppSound("error");
          } catch {
            /* */
          }
          return;
        }
        setStickyReleaseErr(null);
        setErr(null);
        applyJob(res.data.job);
        try {
          const { playAppSound } = await import("@/lib/sound-tone");
          playAppSound(
            isPayoutPendingSettlement(res.data.job)
              ? "success_soft"
              : "job_complete",
          );
        } catch {
          /* */
        }
        // Stay on this job shell → rating + text review, then completion.
        // (Do not router.replace dashboard that skipped the review flow.)
      } catch (e) {
        // Abort/timeout: poll once more before showing failure.
        try {
          const again = await apiGetJob(job.id, { source: "job-action", trigger: "retry" });
          if (again.ok && again.data.job) {
            const j = again.data.job;
            if (isReleaseSettled(j)) {
              setStickyReleaseErr(null);
              setErr(null);
              applyJob(j);
              return;
            }
          }
        } catch {
          /* */
        }
        const msg =
          e instanceof Error
            ? e.message
            : "Release failed. Funds stay in escrow.";
        setErr(msg);
        setStickyReleaseErr(msg);
      } finally {
        setBusy(false);
      }
    })();
  };
}
