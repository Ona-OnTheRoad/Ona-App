import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { INCOMING_POPUP_VISIBLE_SEC } from "@/lib/jobs/incoming-popup-timing";
import { refreshServerClock, serverNow } from "@/lib/jobs/server-clock";
import { isDeadlinePast, secondsLeftFloor } from "@/lib/jobs/countdown-math";
import { isPairingAlert } from "./helpers";
import type { IncomingState } from "./use-incoming-state";
import type { RemoveJob } from "./types";

interface UseIncomingCountdownParams {
  state: IncomingState;
  removeRef: MutableRefObject<RemoveJob>;
}

/** 250ms countdown tick: per-card seconds left + timer-elapsed expiry. */
export function useIncomingCountdown({
  state,
  removeRef,
}: UseIncomingCountdownParams): void {
  const {
    visibleJobs,
    visibleJobsRef,
    surfacedAtRef,
    snoozedJob,
    lightbox,
    setTimeLeftById,
    setConfirmFix,
    setConfirmCancelFix,
  } = state;

  const visibleKey = visibleJobs
    .map((j) => `${j.id}:${j.pairingDeadline || ""}`)
    .join("|");
  useEffect(() => {
    if (visibleJobsRef.current.length === 0 || snoozedJob || lightbox) return;
    // Align the server clock so the card shows the SAME remaining seconds as
    // the customer's ring (both count the same absolute pairing_deadline).
    void refreshServerClock();
    const interval = window.setInterval(() => {
      const jobs = visibleJobsRef.current;
      if (jobs.length === 0) return;
      const nextMap: Record<string, number> = {};
      const expired: string[] = [];
      // Any request whose timer has elapsed (classic + pairing) must also close
      // the "Confirm you can fix this" dialog open over it.
      const deadlineUp: string[] = [];
      for (const j of jobs) {
        const deadlineMs = j.pairingDeadline
          ? Date.parse(j.pairingDeadline)
          : Number.NaN;
        // Any server-owned deadline (the pairing window) drives the card first
        // same value the customer's ring counts, so they stay in sync.
        if (Number.isFinite(deadlineMs)) {
          // Shared countdown math: floor like the customer ring so both phones
          // show the same number, and expire at the real moment (never a tick
          // late). Pairing cards never auto-defer (the sweep owns each wave and
          // re-issues pairing_deadline); classic cards defer when their server
          // window lapses.
          nextMap[j.id] = secondsLeftFloor(deadlineMs, serverNow());
          if (isDeadlinePast(deadlineMs, serverNow())) {
            deadlineUp.push(j.id);
            if (!isPairingAlert(j)) expired.push(j.id);
          }
          continue;
        }
        if (isPairingAlert(j)) {
          // Pairing card mid-transition without a deadline: hold at 0.
          nextMap[j.id] = 0;
          continue;
        }
        // Classic negotiating/agreed: sync to the REAL negotiation deadline
        // when it's armed (the customer counts it down too). A far-future
        // negotiate_ends_at means the request isn't accepted yet → use a
        // local 66s respond window so the card never freezes.
        const endsMs = j.negotiateEndsAt
          ? Date.parse(j.negotiateEndsAt)
          : Number.NaN;
        if (
          Number.isFinite(endsMs) &&
          endsMs - serverNow() <= 24 * 60 * 60 * 1000
        ) {
          nextMap[j.id] = secondsLeftFloor(endsMs, serverNow());
          if (isDeadlinePast(endsMs, serverNow())) {
            deadlineUp.push(j.id);
            expired.push(j.id);
          }
          continue;
        }
        const started = surfacedAtRef.current[j.id] ?? Date.now();
        const remainingMs =
          INCOMING_POPUP_VISIBLE_SEC * 1000 - (Date.now() - started);
        nextMap[j.id] = Math.max(0, Math.floor(remainingMs / 1000));
        if (remainingMs <= 0) {
          deadlineUp.push(j.id);
          expired.push(j.id);
        }
      }
      setTimeLeftById((prev) => ({ ...prev, ...nextMap }));
      // The request's timer elapsed while its "Confirm you can fix this" (or
      // "Decline this job?") dialog was open → close that surface too.
      if (deadlineUp.length > 0) {
        setConfirmFix((c) => (c && deadlineUp.includes(c.id) ? null : c));
        setConfirmCancelFix(false);
      }
      // Expire each classic card independently (defer that request)
      for (const id of expired) {
        removeRef.current(id, { defer: true });
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [
    visibleKey,
    snoozedJob,
    lightbox,
    visibleJobsRef,
    surfacedAtRef,
    removeRef,
    setTimeLeftById,
    setConfirmFix,
    setConfirmCancelFix,
  ]);
}
