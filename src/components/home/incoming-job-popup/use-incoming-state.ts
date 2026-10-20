import { useCallback, useEffect, useRef, useState } from "react";
import type { useRouter } from "next/navigation";
import { ensureAppSession } from "@/lib/supabase/session";
import { requestCloseText } from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import type {
  CloseBannerState,
  LightboxState,
  NotifyClosedOpts,
} from "./types";

import type { PendingOpens } from "./open-request";

interface UseIncomingStateParams {
  backendUserId: string | null | undefined;
  isAuthenticated: boolean;
  authReady: boolean;
  router: ReturnType<typeof useRouter>;
}

/** Owns every piece of popup state + refs, and the small housekeeping effects
 * (ref mirrors, route prefetch, session prewarm, close-banner auto-dismiss). */
export function useIncomingState({
  backendUserId,
  isAuthenticated,
  authReady,
  router,
}: UseIncomingStateParams) {
  const knownIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const primedForId = useRef<string | null | undefined>(undefined);
  const visibleJobsRef = useRef<JobRecord[]>([]);
  const queueRef = useRef<JobRecord[]>([]);
  const osPushed = useRef<Set<string>>(new Set());
  /** When each card was surfaced (local respond-window fallback when the job
   * has no server-owned deadline). */
  const surfacedAtRef = useRef<Record<string, number>>({});
  /** Consecutive polls a card's id was missing from the pro list (grace window
   * for Supabase/realtime blips before the card is truly dropped). */
  const missingCountRef = useRef<Record<string, number>>({});
  /** Job ids we already told the pro was closed so a request that closes
   * once doesn't toast/push repeatedly on every realtime ping. */
  const notifiedCloseRef = useRef<Set<string>>(new Set());
  /** Pending automatic/tap Open operations, shared until their actual result. */
  const pendingOpensRef = useRef<PendingOpens>(new Map());

  /** Up to MAX_VISIBLE_INCOMING full request cards in the lower panel */
  const [visibleJobs, setVisibleJobs] = useState<JobRecord[]>([]);
  const [queue, setQueue] = useState<JobRecord[]>([]);
  const [otherCount, setOtherCount] = useState(0);
  const [confirmFix, setConfirmFix] = useState<JobRecord | null>(null);
  const [confirmCancelFix, setConfirmCancelFix] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [snoozedJob, setSnoozedJob] = useState<JobRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  /** Transient X-style banner "this request was closed". Shown when a live
   * card is closed because the customer cancelled, expired, or moved to another
   * pro. Renders as an in-app top card (mirrors the app's notification toasts);
   * never an OS/browser push. Survives the panel closing. */
  const [closeBanner, setCloseBanner] = useState<CloseBannerState | null>(null);
  /** Seconds left per job id (server deadline) */
  const [timeLeftById, setTimeLeftById] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  useEffect(() => {
    visibleJobsRef.current = visibleJobs;
  }, [visibleJobs]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  /**
   * Background-warm the negotiation screen while a request card is on screen:
   * prefetch the /jobs/[id] route chunk (JS + RSC shell) for every visible
   * and queued request so tapping "I can fix this" lands on an already-loaded
   * screen instead of downloading it after the tap. Best-effort never blocks.
   */
  useEffect(() => {
    const ids = new Set<string>();
    for (const j of visibleJobs) ids.add(j.id);
    for (const j of queue) ids.add(j.id);
    for (const id of ids) {
      try {
        void router.prefetch(`/jobs/${id}`);
      } catch {
        /* prefetch is best-effort */
      }
    }
  }, [visibleJobs, queue, router]);

  /**
   * Prewarm the auth session while the popup is up so the accept tap's
   * OPEN/CONFIRM calls and the negotiation screen's first job fetch resolve
   * from a warm session instead of waiting on a cold storage-rehydrate /
   * refresh roundtrip. Single-flight in session.ts keeps this cheap.
   */
  useEffect(() => {
    if (!isAuthenticated || !authReady || !backendUserId) return;
    void ensureAppSession({ waitForSessionMs: 3500 }).catch(() => {
      /* prewarm is best-effort */
    });
  }, [isAuthenticated, authReady, backendUserId]);

  useEffect(() => {
    if (!closeBanner) return;
    const t = window.setTimeout(() => setCloseBanner(null), 4500);
    return () => window.clearTimeout(t);
  }, [closeBanner]);

  const fullyHide = useCallback(() => {
    setVisibleJobs([]);
    visibleJobsRef.current = [];
    setQueue([]);
    queueRef.current = [];
    setSnoozedJob(null);
    setActionError(null);
    setTimeLeftById({});
    setAcceptingId(null);
    surfacedAtRef.current = {};
    missingCountRef.current = {};
  }, []);

  /** If a request the pro was seeing closed (customer cancelled, request
   * expired, or it went to another pro), tell them once with an in-app
   * X-style banner. Fires whether the card closes via realtime, the status
   * poll, or the list poll. */
  const notifyRequestClosed = useCallback(
    (jobId: string, opts: NotifyClosedOpts) => {
      if (notifiedCloseRef.current.has(jobId)) return;
      // Only announce a close the pro actually witnessed live this session.
      // A pre-existing terminal/history job (already expired/cancelled before
      // this page mounted) must never re-announce on every reload surface
      // only the real transition, exactly once.
      if (!(surfacedAtRef.current[jobId] > 0)) return;
      notifiedCloseRef.current.add(jobId);
      const { job, status = "", movedOn = false } = opts;
      // Cancellations toast through the notification center's top toast (live
      // INSERT on notifications) never also pile a transient banner here, or
      // the pro would see two "Request cancelled" notices for the same event.
      if (!movedOn && String(status).toLowerCase() === "cancelled") return;
      const title = movedOn
        ? "Request moved on"
        : status === "cancelled"
          ? "Request cancelled"
          : status === "expired"
            ? "Request expired"
            : "Request closed";
      setCloseBanner({
        title,
        body: requestCloseText(opts),
        avatarUrl: job?.motoristPhoto || null,
      });
    },
    [],
  );

  /** Reset the per-user "primed" bookkeeping when the pro/account changes. */
  const resetForUser = useCallback(
    (userId: string | null | undefined, signedInPro: boolean) => {
      if (!signedInPro || primedForId.current !== userId) {
        primed.current = false;
        knownIds.current = new Set();
        osPushed.current = new Set();
        surfacedAtRef.current = {};
        missingCountRef.current = {};
        primedForId.current = userId;
        if (!signedInPro) {
          fullyHide();
        }
      }
    },
    [fullyHide],
  );

  return {
    resetForUser,
    knownIds,
    primed,
    primedForId,
    visibleJobsRef,
    queueRef,
    osPushed,
    surfacedAtRef,
    missingCountRef,
    pendingOpensRef,
    visibleJobs,
    setVisibleJobs,
    queue,
    setQueue,
    otherCount,
    setOtherCount,
    confirmFix,
    setConfirmFix,
    confirmCancelFix,
    setConfirmCancelFix,
    acceptingId,
    setAcceptingId,
    snoozedJob,
    setSnoozedJob,
    actionError,
    setActionError,
    closeBanner,
    setCloseBanner,
    timeLeftById,
    setTimeLeftById,
    lightbox,
    setLightbox,
    fullyHide,
    notifyRequestClosed,
  };
}

export type IncomingState = ReturnType<typeof useIncomingState>;
