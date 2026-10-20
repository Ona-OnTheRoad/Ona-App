import { useCallback, useRef, type MutableRefObject } from "react";
import type { useRouter } from "next/navigation";
import type { useNotificationsOptional } from "@/components/notifications/notification-provider";
import { apiGetJob } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import { homePathForForbidden, isForbiddenMessage } from "@/lib/navigation";
import type { useApp } from "@/lib/store";
import type { JobFlowState } from "./use-job-flow-state";

interface Args {
  jobId: string;
  router: ReturnType<typeof useRouter>;
  accountType: ReturnType<typeof useApp>["accountType"];
  notifRef: MutableRefObject<ReturnType<typeof useNotificationsOptional>>;
  commitJob: (next: JobRecord, force?: boolean) => void;
  s: JobFlowState;
}

/** Fetches the active job once and reconciles errors / redirects. */
export function useJobLoad({
  jobId,
  router,
  accountType,
  notifRef,
  commitJob,
  s,
}: Args) {
  const {
    activeJobIdRef,
    jobRef,
    setErr,
    stickyReleaseErr,
    setStickyReleaseErr,
  } = s;
  const inFlight = useRef<{ id: string; promise: Promise<void> } | null>(null);
  const loadOnce = useCallback(async () => {
    // `/jobs/new`: the real job is created in the background; never GET while
    // it doesn't exist yet (a 404 would bounce us home before paint).
    const id = activeJobIdRef.current;
    if (!id || id === "new" || id.startsWith("pending-")) return;
    // One-click: JWT wait trimmed to 500ms (was 4000ms) — seed job already paints, server retries auth.
    try {
      const { ensureAppSession } = await import("@/lib/supabase/session");
      await ensureAppSession({ waitForSessionMs: 500 });
    } catch {
      /* continue apiGetJob retries */
    }
    const res = await apiGetJob(id);
    if (activeJobIdRef.current !== id) return;
    if (!res.ok) {
      if (res.message === "Job not found") {
        const current = notifRef.current;
        if (current) {
          const ids = current.notifications
            .filter((n) => !n.readAt && n.jobId === id)
            .map((n) => n.id);
          if (ids.length) void current.markRead(ids);
        }
        router.replace(accountType === "professional" ? "/jobs" : "/");
        return;
      }
      // Never park on a Forbidden error screen role home immediately
      if (isForbiddenMessage(res.message)) {
        router.replace(homePathForForbidden(accountType));
        return;
      }
      // Soft auth failure: keep spinner, let poll retry don't stick forever
      const authish = /not authenticated|session|sign in|refresh/i.test(
        res.message,
      );
      if (authish && !jobRef.current) {
        setErr(res.message);
        return;
      }
      // Don't overwrite a sticky release error with a generic load failure
      setErr((prev) => stickyReleaseErr || prev || res.message);
      return;
    }
    // Unpaid Ona Express drafts are booking-session state, never an open
    // request: tapping one returns the customer to the page they were on.
    if (
      (res.data.job as unknown as { flowStatus?: string }).flowStatus ===
      "express_pending_payment"
    ) {
      router.back();
      return;
    }
    commitJob(res.data.job);
    // Never clear stickyReleaseErr here only dismiss / successful release
    setErr(stickyReleaseErr ? stickyReleaseErr : null);
    // If payout already done, drop sticky error
    if (
      res.data.job.releasedAt ||
      res.data.job.escrowStatus === "released" ||
      res.data.job.status === "released"
    ) {
      setStickyReleaseErr(null);
    }
  }, [jobId, commitJob, stickyReleaseErr, accountType, router]); // eslint-disable-line react-hooks/exhaustive-deps
  // Polls, realtime, visibility and guards all use this loader. Share a read
  // for the active job rather than launching parallel copies on slow networks.
  const load = useCallback((): Promise<void> => {
    const id = activeJobIdRef.current;
    if (inFlight.current?.id === id) return inFlight.current.promise;
    const promise = loadOnce().catch((error: unknown) => {
      if (activeJobIdRef.current !== id) return;
      const message = error instanceof Error ? error.message : "Could not refresh job. Retrying…";
      setErr((prev) => stickyReleaseErr || prev || message);
    }).finally(() => {
      if (inFlight.current?.promise === promise) inFlight.current = null;
    });
    inFlight.current = { id, promise };
    return promise;
  }, [activeJobIdRef, loadOnce, setErr, stickyReleaseErr]);
  return { load };
}
