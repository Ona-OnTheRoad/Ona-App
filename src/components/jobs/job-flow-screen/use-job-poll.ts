import { useEffect } from "react";
import type { JobRecord } from "@/lib/jobs/types";

interface Args {
  job: JobRecord | null;
  authReady: boolean;
  isAuthenticated: boolean;
  actorId: string;
  load: () => Promise<void>;
  setErr: (v: string | null) => void;
}

/** Adaptive job polling + realtime job-row subscription. */
export function useJobPoll({
  job,
  authReady,
  isAuthenticated,
  actorId,
  load,
  setErr,
}: Args) {
  // Poll job state; faster while trip active / awaiting satisfaction.
  // Wait for authReady so we never hit /api/jobs with no Bearer after create→navigate.
  // While still loading (no job), poll every 2s so auth race recovers quickly.
  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      setErr("Please sign in to view this job.");
      return;
    }
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await load();
    };
    void tick();
    // Pairing must poll fast so customer picks up the same pairing_deadline
    // as the pro (pro popup was starting first with a 12s customer lag).
    const pairingLive =
      job &&
      (job.status === "waiting_for_selected" ||
        job.status === "selected_review" ||
        job.status === "sequential_pairing" ||
        job.status === "waiting_for_pro" ||
        job.status === "reserved");
    const ms = !job
      ? 2_000
      : pairingLive
        ? 1_000
        : job.status === "negotiating" ||
            job.status === "searching" ||
            job.status === "agreed"
          ? 8_000
          : job.status === "completed"
            ? 15_000
            : ["paid_booked", "en_route", "arrived", "in_progress"].includes(
                  job.status,
                )
              ? 15_000
              : job.status === "released" || job.status === "satisfied"
                ? 45_000
                : 60_000;
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void tick();
    }, ms);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [load, job?.status, job, authReady, isAuthenticated, setErr]);

  // Realtime job row → customer/pro share the same pairing_deadline instantly
  // (fixes pro timer starting before customer ring updates).
  useEffect(() => {
    if (!authReady || !isAuthenticated || !actorId) return;
    let unsub: (() => void) | null = null;
    let cancelled = false;
    void import("@/lib/supabase/app-api").then(({ backendSubscribeJobs }) => {
      if (cancelled) return;
      unsub = backendSubscribeJobs(actorId, () => {
        void load();
      });
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [authReady, isAuthenticated, actorId, load]);
}
