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
  const jobId = job?.id;
  const status = job?.status;

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
    let polling = false;
    let pendingRealtime = false;
    const tick = async (reconcile = false) => {
      if (cancelled) return;
      if (polling) {
        if (reconcile) pendingRealtime = true;
        return;
      }
      polling = true;
      try {
        await load();
      } catch (error) {
        if (!cancelled) setErr(error instanceof Error ? error.message : "Could not refresh job. Retrying…");
      } finally {
        polling = false;
        if (pendingRealtime && !cancelled) {
          pendingRealtime = false;
          void tick();
        }
      }
    };
    void tick();
    // Pairing must poll fast so customer picks up the same pairing_deadline
    // as the pro (pro popup was starting first with a 12s customer lag).
    const pairingLive =
      status &&
      (status === "waiting_for_selected" ||
        status === "selected_review" ||
        status === "sequential_pairing" ||
        status === "waiting_for_pro" ||
        status === "reserved");
    const ms = !status
      ? 2_000
      : pairingLive
        ? 1_000
        : status === "negotiating" ||
            status === "searching" ||
            status === "agreed"
          ? 8_000
          : status === "completed"
            ? 15_000
            : ["paid_booked", "en_route", "arrived", "in_progress"].includes(
                  status,
                )
              ? 15_000
              : status === "released" || status === "satisfied"
                ? 45_000
                : 60_000;
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void tick();
    }, ms);
    // Share the same read gate with realtime. One event received mid-read
    // needs a follow-up; interval ticks alone do not create a retry backlog.
    let unsub: (() => void) | null = null;
    if (actorId) {
      void import("@/lib/supabase/app-api").then(({ backendSubscribeJobs }) => {
        if (!cancelled) unsub = backendSubscribeJobs(actorId, () => void tick(true));
      }).catch(() => { /* Polling remains available if realtime cannot load. */ });
    }
    return () => {
      cancelled = true;
      window.clearInterval(id);
      unsub?.();
    };
  }, [load, jobId, status, actorId, authReady, isAuthenticated, setErr]);
}
