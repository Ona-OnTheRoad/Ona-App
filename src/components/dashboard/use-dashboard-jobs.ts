import { useCallback, useEffect, useState } from "react";
import { apiListJobs, apiPairingSweep } from "@/lib/jobs/client";
import { windowStillOpen } from "@/lib/jobs/deadline";
import { isPayoutPendingSettlement } from "@/lib/jobs/constants";
import { backendSubscribeJobs } from "@/lib/supabase/app-api";
import type { JobRecord } from "@/lib/jobs/types";
import {
  INCOMING_STATUSES,
  ONGOING_STATUSES,
  RECENT_STATUSES,
} from "./dashboard-helpers";

export function useDashboardJobs(backendUserId: string | null | undefined) {
  const [incoming, setIncoming] = useState<JobRecord[]>([]);
  const [ongoing, setOngoing] = useState<JobRecord[]>([]);
  const [recent, setRecent] = useState<JobRecord[]>([]);
  const [payoutProcessing, setPayoutProcessing] = useState<JobRecord[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsCompletedCount, setJobsCompletedCount] = useState(0);

  const loadJobs = useCallback(async () => {
    if (!backendUserId) {
      setIncoming([]);
      setOngoing([]);
      setRecent([]);
      setJobsCompletedCount(0);
      setJobsLoading(false);
      return;
    }
    const res = await apiListJobs(backendUserId, "repair_pro");
    if (res.ok) {
      const mine = res.data.jobs.filter((j) => {
        if (j.repairProId !== backendUserId) return false;
        if (!j.motoristId || !j.problem?.trim()) return false;
        return true;
      });

      // Jobs completed = times customers tapped I am Satisfied (released)
      setJobsCompletedCount(
        mine.filter((j) => ["satisfied", "released"].includes(j.status)).length,
      );

      const open = mine
        .filter((j) => {
          if (!INCOMING_STATUSES.has(j.status)) return false;
          if (j.negotiateEndsAt && !windowStillOpen(j.negotiateEndsAt)) {
            return false;
          }
          if (j.pairingDeadline && !windowStillOpen(j.pairingDeadline)) {
            return false;
          }
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      const active = mine
        .filter((j) => ONGOING_STATUSES.has(j.status))
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime(),
        );

      const payoutPending = mine
        .filter(
          (j) => RECENT_STATUSES.has(j.status) && isPayoutPendingSettlement(j),
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime(),
        );

      const finished = mine
        .filter(
          (j) => RECENT_STATUSES.has(j.status) && !isPayoutPendingSettlement(j),
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime(),
        )
        .slice(0, 6);

      setIncoming(open);
      setOngoing(active);
      setPayoutProcessing(payoutPending);
      setRecent(finished);
    } else {
      setIncoming([]);
      setOngoing([]);
      setRecent([]);
    }
    setJobsLoading(false);
  }, [backendUserId]);

  useEffect(() => {
    void loadJobs();
    // Realtime + IncomingJobPopup keep requests live; list is a soft refresh
    const t = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void loadJobs();
    }, 240_000);
    return () => window.clearInterval(t);
  }, [loadJobs]);

  // A realtime push (customer cancel/complete, pro decline, reassign) must drop
  // the request from the Incoming list immediately never wait for the 4-min
  // soft refresh. The push already carries the row; a cheap refetch reconciles.
  useEffect(() => {
    if (!backendUserId) return;
    let cancelled = false;
    let schedule: number | undefined;
    const unsub = backendSubscribeJobs(backendUserId, () => {
      if (cancelled || typeof document === "undefined" || document.hidden)
        return;
      if (schedule) return;
      schedule = window.setTimeout(() => {
        schedule = undefined;
        void loadJobs();
      }, 150);
    });
    return () => {
      cancelled = true;
      if (schedule) window.clearTimeout(schedule);
      unsub?.();
    };
  }, [backendUserId, loadJobs]);

  // Expiry watcher: an incoming card must vanish the instant its server-owned
  // window closes — never wait for the soft-refresh poll or a manual reload.
  // Same clock + helpers as loadJobs (serverNow base), so the dashboard agrees
  // with the popup ring and the customer's countdown. On expiry we also nudge
  // the server's pairing sweep so the job advances (expired → next pro) right
  // away instead of waiting on the throttled sweep. Purely local clock checks
  // no extra network traffic while cards are live.
  useEffect(() => {
    if (incoming.length === 0) return;
    const tick = () => {
      const expiredIds = incoming
        .filter(
          (j) =>
            (j.pairingDeadline && !windowStillOpen(j.pairingDeadline)) ||
            (j.negotiateEndsAt && !windowStillOpen(j.negotiateEndsAt)),
        )
        .map((j) => j.id);
      if (expiredIds.length === 0) return;
      const gone = new Set(expiredIds);
      setIncoming((prev) => prev.filter((j) => !gone.has(j.id)));
      void apiPairingSweep().catch(() => {
        /* sweep is best-effort next poll reconciles */
      });
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [incoming]);

  return {
    incoming,
    ongoing,
    recent,
    payoutProcessing,
    jobsLoading,
    jobsCompletedCount,
    setJobsCompletedCount,
  };
}
