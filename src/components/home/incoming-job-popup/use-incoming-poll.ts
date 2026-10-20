import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { apiListJobs, apiProIncomingStatus } from "@/lib/jobs/client";
import { isProRequestCardKeepable } from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import { backendSubscribeJobs } from "@/lib/supabase/app-api";
import { INCOMING_POPUP_STATUS_POLL_MS } from "./constants";
import { ingestIncomingJobs } from "./ingest-jobs";
import type { IncomingState } from "./use-incoming-state";
import type { NotifyRequestClosed, PanelLevel, RemoveJob } from "./types";

interface UseIncomingPollParams {
  accountType: string | null | undefined;
  backendUserId: string | null | undefined;
  isAuthenticated: boolean;
  authReady: boolean;
  pathname: string;
  state: IncomingState;
  removeRef: MutableRefObject<RemoveJob>;
  presentJob: (j: JobRecord) => Promise<void>;
  offerJob: (j: JobRecord) => void;
  setLevel: Dispatch<SetStateAction<PanelLevel>>;
}

/** Poll (1s status / list every few cycles) + Supabase realtime close, plus the
 * per-user reset of the "primed" bookkeeping. */
export function useIncomingPoll({
  accountType,
  backendUserId,
  isAuthenticated,
  authReady,
  pathname,
  state,
  removeRef,
  presentJob,
  offerJob,
  setLevel,
}: UseIncomingPollParams): void {
  const {
    knownIds,
    primed,
    visibleJobsRef,
    queueRef,
    missingCountRef,
    setOtherCount,
    setVisibleJobs,
    setQueue,
    resetForUser,
    notifyRequestClosed,
  } = state;

  // Always call the freshest callbacks from inside the long-lived effect
  // without re-subscribing it (the effect's own deps stay as they were).
  const latest = useRef<{
    notifyRequestClosed: NotifyRequestClosed;
    presentJob: (j: JobRecord) => Promise<void>;
    offerJob: (j: JobRecord) => void;
  }>({ notifyRequestClosed, presentJob, offerJob });
  useEffect(() => {
    latest.current = { notifyRequestClosed, presentJob, offerJob };
  });

  // Poll + realtime
  useEffect(() => {
    if (
      !authReady ||
      !isAuthenticated ||
      accountType !== "professional" ||
      !backendUserId
    ) {
      return;
    }

    let cancelled = false;

    const ingest = (jobs: JobRecord[]) => {
      ingestIncomingJobs(jobs, {
        backendUserId,
        knownIds,
        primed,
        visibleJobsRef,
        queueRef,
        missingCountRef,
        setOtherCount,
        setVisibleJobs,
        setQueue,
        setLevel,
        ...latest.current,
      });
    };

    let polling = false;
    let pending = false;
    let tick = 0;
    /** Ultra-light close check: one tiny query for the visible card ids. Detects
     * a customer cancellation/close within ~1s even when the realtime push is
     * missed no list payload, no media, no expiry work. */
    const statusCheck = async () => {
      const visible = visibleJobsRef.current;
      if (visible.length === 0) return;
      const res = await apiProIncomingStatus(visible.map((j) => j.id));
      if (cancelled || !res.ok) return;
      const byId = new Map(res.data.jobs.map((j) => [j.id, j]));
      for (const cur of visible.slice()) {
        const s = byId.get(cur.id);
        if (!s) continue;
        const movedOn =
          (Boolean(s.repairProId) && s.repairProId !== backendUserId) || false;
        if (!isProRequestCardKeepable(s.status, s.pairingStage) || movedOn) {
          latest.current.notifyRequestClosed(cur.id, {
            job: cur,
            status: s.status,
            movedOn,
          });
          removeRef.current(cur.id);
          continue;
        }
        // Keep the card's countdown in lockstep with the server deadline.
        if (s.pairingDeadline && s.pairingDeadline !== cur.pairingDeadline) {
          setVisibleJobs((prev) =>
            prev.map((j) =>
              j.id === s.id ? { ...j, pairingDeadline: s.pairingDeadline } : j,
            ),
          );
        }
      }
    };
    const poll = async () => {
      // Never lose an update that arrives mid-fetch: if a poll is already in
      // flight, remember the request and re-run right after it settles instead
      // of swallowing it (that was the "close is a few seconds late" bug).
      if (polling) {
        pending = true;
        return;
      }
      polling = true;
      try {
        // While a card is on screen, prefer the per-card status check (tiny).
        // Every few cycles run the full lean list so NEW offers surface and
        // everything reconciles even when realtime is missed.
        const visibleCount = visibleJobsRef.current.length;
        if (visibleCount > 0 && tick < 2) {
          tick++;
          await statusCheck();
        } else {
          tick = 0;
          const res = await apiListJobs(backendUserId, "repair_pro", {
            lean: true,
          });
          if (cancelled || !res.ok) return;
          ingest(res.data.jobs);
        }
      } catch {
        // Keep the last known cards on transient read failures. The next
        // scheduled poll (or a pending realtime update) reconciles them.
      } finally {
        polling = false;
        if (pending && !cancelled) {
          pending = false;
          void poll();
        }
      }
    };

    // A realtime push already contains the row close a card the instant the
    // server moves it out of an actionable status (customer cancel/complete,
    // pro decline, …). No need to wait for the next poll. Pairing rows keep
    // their stage in pairing_stage/flow_status while the legacy `status`
    // column stays "requested", so keepability checks all three.
    const applyRealtimeClose = (payload?: {
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => {
      const row = payload?.new ?? payload?.old;
      if (!row || typeof row.id !== "string") return;
      const status = String(row.flow_status ?? row.status ?? "");
      const movedOn =
        typeof row.repair_pro_id === "string" &&
        row.repair_pro_id !== backendUserId;
      const keep = isProRequestCardKeepable(
        status,
        String(row.pairing_stage ?? ""),
      );
      if (!keep || movedOn) {
        const known =
          visibleJobsRef.current.find((j) => j.id === row.id) ||
          queueRef.current.find((j) => j.id === row.id) ||
          null;
        latest.current.notifyRequestClosed(String(row.id), {
          job: known,
          status,
          movedOn,
        });
        removeRef.current(String(row.id));
      }
    };

    void poll();
    // A card on screen is time-critical: the customer can close the request at any
    // moment, and a missed realtime event (flaky mobile network) must still drop
    // the card within ~1s the server already refuses stale taps, but the card
    // shouldn't outlive the request. Idle pros poll less.
    // Local deadline timer + Realtime still wake instantly on new offers.
    // The cadence is decided at FIRE time from what is visible NOW, and the
    // wake points (mount, realtime push) arm the fast 1s interval so a card
    // that just surfaced is not stuck behind the 3s idle timer before its
    // first status check.
    let timer = 0;
    const schedule = (delay?: number) => {
      timer = window.setTimeout(
        () => {
          if (typeof document !== "undefined" && document.hidden) {
            schedule();
            return;
          }
          void poll();
          schedule();
        },
        delay ??
          (visibleJobsRef.current.length || queueRef.current.length
            ? INCOMING_POPUP_STATUS_POLL_MS
            : 3_000),
      );
    };
    schedule(INCOMING_POPUP_STATUS_POLL_MS);

    const unsub = backendSubscribeJobs(backendUserId, (payload) => {
      applyRealtimeClose(payload);
      if (!cancelled) {
        void poll();
        // A push may have surfaced a card while the timer sat armed at the
        // idle 12s jump onto the fast 1s cadence so its first status check
        // isn't delayed.
        clearTimeout(timer);
        schedule(INCOMING_POPUP_STATUS_POLL_MS);
      }
    });

    const onVis = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
      unsub?.();
    };
  }, [
    accountType,
    backendUserId,
    isAuthenticated,
    authReady,
    pathname,
    knownIds,
    primed,
    visibleJobsRef,
    queueRef,
    missingCountRef,
    removeRef,
    setOtherCount,
    setVisibleJobs,
    setQueue,
    setLevel,
  ]);

  useEffect(() => {
    resetForUser(
      backendUserId,
      Boolean(isAuthenticated) && accountType === "professional",
    );
  }, [isAuthenticated, accountType, backendUserId, resetForUser]);
}
