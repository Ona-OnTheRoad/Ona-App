import { useCallback, useEffect, useRef } from "react";
import type { useRouter } from "next/navigation";
import { vibrateCallPattern } from "@/lib/app-notify";
import { apiDeferJob, apiGetJob } from "@/lib/jobs/client";
import {
  canSurfaceIncomingJob,
  INCOMING_POPUP_VISIBLE_SEC,
  markJobShown,
  PAIRING_ACTION_STAGES,
} from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import { enablePushNotifications } from "@/lib/push/client";
import { playAppSound, unlockAudio } from "@/lib/sound-tone";
import { MAX_VISIBLE_INCOMING } from "./constants";
import { ensureIncomingRequestOpen } from "./open-request";
import { showOsNotificationOnce } from "./os-notification";
import type { IncomingState } from "./use-incoming-state";
import type { RemoveJob, RemoveJobOpts } from "./types";

interface UseIncomingQueueParams {
  backendUserId: string | null | undefined;
  router: ReturnType<typeof useRouter>;
  state: IncomingState;
}

/** Surface / queue / remove logic for the (max 2) visible request cards. */
export function useIncomingQueue({
  backendUserId,
  router,
  state,
}: UseIncomingQueueParams) {
  const {
    osPushed,
    pendingOpensRef,
    visibleJobsRef,
    queueRef,
    surfacedAtRef,
    setVisibleJobs,
    setQueue,
    setSnoozedJob,
    setActionError,
    setTimeLeftById,
    setConfirmFix,
    setConfirmCancelFix,
    fullyHide,
  } = state;

  const pushOsOnce = useCallback(
    (j: JobRecord) => {
      showOsNotificationOnce(j, osPushed);
    },
    [osPushed],
  );

  /**
   * Auto-reserve the request the moment its card surfaces (OPEN = reserve for
   * this pro). By the time the pro taps "I can fix this" the reservation is
   * already held server-side, so the tap only needs CONFIRM. Uses the same
   * idempotency key as the tap's OPEN so a double call is a server noop.
   * Best-effort: the tap awaits the same result, or retries after a failure.
   */
  const ensureOpened = useCallback(
    (j: JobRecord) => {
      if (!backendUserId) return;
      if (!PAIRING_ACTION_STAGES.has(j.status ?? "")) return;
      const stage = j.pairingStage ?? "";
      const needsOpen =
        stage === "waiting_for_selected" || stage === "waiting_for_pro";
      if (!needsOpen) return;
      void ensureIncomingRequestOpen(j, backendUserId, pendingOpensRef.current);
    },
    [backendUserId, pendingOpensRef],
  );

  /**
   * Add/update a job in a free visible slot (max 2).
   * Customer photos/voice load before open when missing.
   */
  const presentJob = useCallback(
    async (j: JobRecord) => {
      markJobShown(j.id, backendUserId || undefined, j.pairingDeadline || null);

      // OS push only when the incoming panel isn't already on screen a pro
      // looking at the request cards sees new work without a browser
      // notification (same brand rule as the toast pile: no double voice).
      const panelAlreadyOpen = visibleJobsRef.current.length > 0;

      let job = j;
      const hasMedia =
        (Array.isArray(j.photos) && j.photos.length > 0) ||
        Boolean(j.voiceNote?.url);
      if (!hasMedia) {
        try {
          const res = await apiGetJob(j.id);
          if (res.ok) {
            const full = res.data.job;
            job = {
              ...j,
              ...full,
              pairingDeadline:
                full.pairingDeadline || j.pairingDeadline || null,
              photos: full.photos?.length ? full.photos : j.photos || [],
              voiceNote: full.voiceNote || j.voiceNote || null,
              motoristPhoto: full.motoristPhoto || j.motoristPhoto || null,
            };
          }
        } catch {
          /* open with text-only if media fetch fails */
        }
      }

      setVisibleJobs((prev) => {
        const idx = prev.findIndex((x) => x.id === j.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = job;
          visibleJobsRef.current = next;
          return next;
        }
        if (prev.length >= MAX_VISIBLE_INCOMING) return prev;
        const next = [...prev, job].slice(0, MAX_VISIBLE_INCOMING);
        visibleJobsRef.current = next;
        return next;
      });
      setSnoozedJob(null);
      setActionError(null);
      setTimeLeftById((m) => ({
        ...m,
        [job.id]: INCOMING_POPUP_VISIBLE_SEC,
      }));
      surfacedAtRef.current[job.id] = Date.now();
      unlockAudio();
      playAppSound("request_new");
      vibrateCallPattern();
      // The request is now ON this pro's screen. Ask the server to arm the
      // shared pairing_deadline exactly once (the server noops if a deadline is
      // already set) so the 66s timer starts at this instant on this card AND
      // the customer's ring and never rolls back. Fire-and-forget.
      import("@/lib/jobs/client")
        .then(({ apiSurfaceJob }) => apiSurfaceJob(job.id))
        .catch(() => {
          /* surface alignment best-effort */
        });
      // Reserve for this pro right away so the accept tap only needs CONFIRM.
      ensureOpened(job);
      // Enroll this device for web-push (once per session) so the server can
      // reach the pro with a cancellation OS notification even when the app is
      // closed or the tab hidden. Best-effort; never blocks the card.
      void enablePushNotifications(backendUserId);
      if (!panelAlreadyOpen) pushOsOnce(job);
    },
    [
      pushOsOnce,
      backendUserId,
      ensureOpened,
      visibleJobsRef,
      surfacedAtRef,
      setVisibleJobs,
      setSnoozedJob,
      setActionError,
      setTimeLeftById,
    ],
  );

  /** Present up to 2 jobs; extras wait in queue until a slot frees. */
  const offerJob = useCallback(
    (j: JobRecord) => {
      const gate = canSurfaceIncomingJob(j.id, {
        proId: backendUserId || undefined,
        pairingDeadline: j.pairingDeadline || null,
      });
      if (!gate.allow) return;

      const visible = visibleJobsRef.current;
      const existing = visible.find((x) => x.id === j.id);
      if (existing) {
        if (
          j.pairingDeadline &&
          existing.pairingDeadline !== j.pairingDeadline
        ) {
          void presentJob(j);
        }
        return;
      }
      if (visible.length < MAX_VISIBLE_INCOMING) {
        void presentJob(j);
        return;
      }
      setQueue((prev) => {
        if (prev.some((x) => x.id === j.id)) return prev;
        const next = [...prev, j].slice(0, 8);
        queueRef.current = next;
        return next;
      });
    },
    [presentJob, backendUserId, visibleJobsRef, queueRef, setQueue],
  );

  /** Remove one card; promote next from queue into free slot. */
  const removeJobAndMaybeNext = useCallback(
    (jobId: string, opts?: RemoveJobOpts) => {
      const proId = backendUserId;
      const target =
        visibleJobsRef.current.find((j) => j.id === jobId) ||
        queueRef.current.find((j) => j.id === jobId);
      if (opts?.defer && target && proId) {
        void apiDeferJob(target.id, proId);
      }
      if (opts?.goDashboard) {
        fullyHide();
        router.replace("/dashboard");
        return;
      }

      const rest = visibleJobsRef.current.filter((j) => j.id !== jobId);
      let q = queueRef.current.filter((j) => j.id !== jobId);
      // Any surface for this request must close too including the "Confirm
      // you can fix this" dialog that may be open over the expired card.
      setConfirmFix((c) => (c?.id === jobId ? null : c));
      setConfirmCancelFix(false);
      // Promote queued jobs into free slots after state settles
      const toPresent: JobRecord[] = [];
      while (
        rest.length + toPresent.length < MAX_VISIBLE_INCOMING &&
        q.length > 0
      ) {
        const [next, ...tail] = q;
        q = tail;
        toPresent.push(next);
      }
      queueRef.current = q;
      setQueue(q);
      visibleJobsRef.current = rest;
      setVisibleJobs(rest);
      setTimeLeftById((m) => {
        const n = { ...m };
        delete n[jobId];
        return n;
      });
      delete surfacedAtRef.current[jobId];
      if (rest.length === 0 && q.length === 0) {
        setSnoozedJob(null);
        setActionError(null);
      }
      for (const n of toPresent) void presentJob(n);
    },
    [
      backendUserId,
      fullyHide,
      presentJob,
      router,
      visibleJobsRef,
      queueRef,
      surfacedAtRef,
      setConfirmFix,
      setConfirmCancelFix,
      setQueue,
      setVisibleJobs,
      setTimeLeftById,
      setSnoozedJob,
      setActionError,
    ],
  );

  // Progress lines ALWAYS each job.pairingDeadline (same as customer ring).
  const removeRef = useRef<RemoveJob>(removeJobAndMaybeNext);
  useEffect(() => {
    removeRef.current = removeJobAndMaybeNext;
  });

  return { presentJob, offerJob, removeJobAndMaybeNext, removeRef };
}
