import { recordJobDiagnostic } from "@/lib/jobs/diagnostics/collector";
import type { JobTrigger } from "@/lib/jobs/diagnostics/types";
import { computeAdaptiveJobPollDelayMs } from "@/lib/jobs/adaptive-poll";
import type { JobRecord } from "@/lib/jobs/types";
import type { JobSubscriptionState } from "@/lib/supabase/shared-job-subscriptions";
import { useEffect, type MutableRefObject } from "react";
import type { JobLoadOutcome } from "./use-job-load";

interface Args {
  job: JobRecord | null;
  authReady: boolean;
  isAuthenticated: boolean;
  actorId: string;
  load: (trigger?: JobTrigger) => Promise<JobLoadOutcome | void>;
  lastOutcomeRef?: MutableRefObject<JobLoadOutcome>;
  setErr: (v: string | null) => void;
  /** Optional jitter ratio in [0, 0.25] for failure backoff. Defaults to 0.15. */
  backoffJitterRatio?: number;
}

/** Adaptive job polling + realtime job-row subscription with health-aware recovery. */
export function useJobPoll({
  job,
  authReady,
  isAuthenticated,
  actorId,
  load,
  lastOutcomeRef,
  setErr,
  backoffJitterRatio = 0.15,
}: Args) {
  const jobId = job?.id;
  const status = job?.status;

  // Poll job state; faster while unconnected / degraded, slower safety poll
  // once realtime is confirmed SUBSCRIBED, with bounded exponential backoff
  // on consecutive read failures.
  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      setErr("Please sign in to view this job.");
      return;
    }
    let cancelled = false;
    let polling = false;
    let pendingReconcile = false;
    let pendingTrigger: JobTrigger = "realtime";
    let initialCompleted = false;
    let consecutiveFailures = 0;
    let subscriptionState: JobSubscriptionState = "connecting";
    let online =
      typeof navigator === "undefined" || navigator.onLine !== false;
    let timerId = 0;

    const clearTimer = () => {
      if (timerId) {
        window.clearTimeout(timerId);
        timerId = 0;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      if (cancelled) return;
      const delayMs = computeAdaptiveJobPollDelayMs({
        status,
        subscriptionState,
        online,
        consecutiveFailures,
        jitterRatio: backoffJitterRatio,
      });
      timerId = window.setTimeout(() => {
        timerId = 0;
        if (cancelled) return;
        if (typeof document !== "undefined" && document.hidden) {
          scheduleNext();
          return;
        }
        void tick(false, "interval");
      }, delayMs);
    };

    const tick = async (reconcile = false, trigger: JobTrigger = "initial") => {
      recordJobDiagnostic("trigger", "job", { source: "job-screen", trigger }, "ok");
      if (cancelled) return;
      if (polling) {
        recordJobDiagnostic("trigger", "job", { source: "job-screen", trigger }, "coalesced");
        if (reconcile) {
          pendingReconcile = true;
          pendingTrigger = trigger;
        }
        return;
      }
      polling = true;
      clearTimer();
      try {
        const directOutcome = await load(trigger);
        const outcome = directOutcome ?? lastOutcomeRef?.current;
        if (outcome === "http-error") {
          consecutiveFailures += 1;
        } else if (outcome === "ok" || outcome === undefined) {
          consecutiveFailures = 0;
        }
      } catch (error) {
        consecutiveFailures += 1;
        if (!cancelled) {
          setErr(
            error instanceof Error
              ? error.message
              : "Could not refresh job. Retrying…",
          );
        }
      } finally {
        polling = false;
        if (trigger === "initial") {
          initialCompleted = true;
        }
        if (pendingReconcile && !cancelled) {
          const nextTrigger = pendingTrigger;
          pendingReconcile = false;
          void tick(false, nextTrigger);
        } else if (!cancelled) {
          scheduleNext();
        }
      }
    };

    void tick(false, "initial");

    // Share the same read gate with realtime. One event received mid-read
    // needs a follow-up; interval ticks alone do not create a retry backlog.
    let unsub: (() => void) | null = null;
    if (actorId) {
      void import("@/lib/supabase/app-api")
        .then(({ backendSubscribeJobs }) => {
          if (cancelled) return;
          unsub = backendSubscribeJobs(
            actorId,
            () => {
              consecutiveFailures = 0;
              void tick(true, "realtime");
            },
            "job-screen",
            (nextState, meta) => {
              if (cancelled) return;
              const prevState = subscriptionState;
              subscriptionState = nextState;
              if (nextState === "connected") {
                consecutiveFailures = 0;
                // Reconcile immediately when recovering from a degraded/failed channel,
                // or when initial SUBSCRIBED arrives while/after the initial fetch is in flight
                // so changes between initial read start and subscription readiness are not missed.
                const initialGap =
                  prevState === "connecting" &&
                  !meta.hadPriorConnection &&
                  (!initialCompleted || polling);
                if (meta.reconnected || initialGap) {
                  void tick(true, "realtime");
                  return;
                }
              }
              if (!polling) {
                scheduleNext();
              }
            },
          );
        })
        .catch(() => {
          /* Polling remains available if realtime cannot load. */
        });
    }

    const onVisibilityChange = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && !document.hidden) {
        consecutiveFailures = 0;
        void tick(true, "visibility");
      }
    };

    const onOnline = () => {
      if (cancelled) return;
      online = true;
      consecutiveFailures = 0;
      void tick(true, "visibility");
    };

    const onOffline = () => {
      if (cancelled) return;
      online = false;
      if (!polling) {
        scheduleNext();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
    }

    return () => {
      cancelled = true;
      clearTimer();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      }
      unsub?.();
    };
  }, [
    load,
    jobId,
    status,
    actorId,
    authReady,
    isAuthenticated,
    setErr,
    backoffJitterRatio,
  ]);
}
