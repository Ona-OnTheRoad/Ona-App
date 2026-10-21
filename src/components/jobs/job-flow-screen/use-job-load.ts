import { beginJobDiagnostic, recordJobDiagnostic } from "@/lib/jobs/diagnostics/collector";
import { diagnosticFailure, type JobTrigger } from "@/lib/jobs/diagnostics/measure";
import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import type { useRouter } from "next/navigation";
import type { useNotificationsOptional } from "@/components/notifications/notification-provider";
import { apiGetJob } from "@/lib/jobs/client";
import { useSnapshotScope } from "@/lib/jobs/use-snapshot-scope";
import { reconcileJobSnapshot } from "@/lib/jobs/snapshot-reads";
import type { JobRecord } from "@/lib/jobs/types";
import { homePathForForbidden, isForbiddenMessage } from "@/lib/navigation";
import type { useApp } from "@/lib/store";
import type { JobFlowState } from "./use-job-flow-state";

export type JobLoadOutcome = "ok" | "http-error" | "skipped";

interface Args {
  jobId: string;
  backendUserId: string | null;
  isAuthenticated: boolean;
  router: ReturnType<typeof useRouter>;
  accountType: ReturnType<typeof useApp>["accountType"];
  notifRef: MutableRefObject<ReturnType<typeof useNotificationsOptional>>;
  commitJob: (next: JobRecord, force?: boolean) => void;
  s: JobFlowState;
}

/** Fetches the active job once and reconciles errors / redirects. */
export function useJobLoad({
  jobId,
  backendUserId,
  isAuthenticated,
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
    setJob,
    stickyReleaseErr,
    setStickyReleaseErr,
  } = s;
  const scope = useSnapshotScope(backendUserId, accountType, isAuthenticated, jobId);
  const inFlight = useRef<{ id: string; promise: Promise<void> } | null>(null);
  const lastOutcomeRef = useRef<JobLoadOutcome>("ok");
  const previousScope = useRef({ scope, backendUserId, accountType, isAuthenticated });
  useEffect(() => {
    inFlight.current = null;
    const previous = previousScope.current;
    if (previous.scope !== scope) {
      const identityChanged = previous.backendUserId !== backendUserId ||
        previous.accountType !== accountType || previous.isAuthenticated !== isAuthenticated;
      previousScope.current = { scope, backendUserId, accountType, isAuthenticated };
      setJob((current) => {
        // Bootstrap may already have painted the destination's seed in this
        // effect pass. Keep that seed only within the same authenticated role.
        const next = !identityChanged && current?.id === activeJobIdRef.current ? current : null;
        jobRef.current = next;
        return next;
      });
      setErr(null);
      setStickyReleaseErr(null);
    }
  }, [scope, backendUserId, accountType, isAuthenticated, activeJobIdRef, jobRef, setJob, setErr, setStickyReleaseErr]);
  const loadOnce = useCallback(async (trigger: JobTrigger) => {
    const capture = scope.capture();
    if (!capture) return "skipped" as const;
    // `/jobs/new`: the real job is created in the background; never GET while
    // it doesn't exist yet (a 404 would bounce us home before paint).
    const id = activeJobIdRef.current;
    if (!id || id === "new" || id.startsWith("pending-")) return "skipped" as const;
    const started = jobRef.current;
    const res = await capture.read(`job:${id}`, async () => {
      try {
        const { ensureAppSession } = await import("@/lib/supabase/session");
        await ensureAppSession({ waitForSessionMs: 500 });
      } catch { /* continue apiGetJob retries */ }
      return apiGetJob(id, { source: "job-screen", trigger });
    }, trigger === "realtime" || trigger === "visibility" || trigger === "action",
    () => recordJobDiagnostic("trigger", "job", { source: "job-screen", trigger }, "coalesced"));
    if (!capture.isCurrent() || activeJobIdRef.current !== id) return "skipped" as const;
    if (!res.ok) {
      if (jobRef.current !== started) return "skipped" as const;
      recordJobDiagnostic("trigger", "job", { source: "job-screen", trigger }, "http-error");
      if (res.message === "Job not found") {
        const current = notifRef.current;
        if (current) {
          const ids = current.notifications
            .filter((n) => !n.readAt && n.jobId === id)
            .map((n) => n.id);
          if (ids.length) void current.markRead(ids);
        }
        router.replace(accountType === "professional" ? "/jobs" : "/");
        return "http-error" as const;
      }
      // Never park on a Forbidden error screen role home immediately
      if (isForbiddenMessage(res.message)) {
        router.replace(homePathForForbidden(accountType));
        return "http-error" as const;
      }
      // Soft auth failure: keep spinner, let poll retry don't stick forever
      const authish = /not authenticated|session|sign in|refresh/i.test(
        res.message,
      );
      if (authish && !jobRef.current) {
        setErr(res.message);
        return "http-error" as const;
      }
      // Don't overwrite a sticky release error with a generic load failure
      setErr((prev) => stickyReleaseErr || prev || res.message);
      return "http-error" as const;
    }
    const reconciled = reconcileJobSnapshot(res.data.job, jobRef.current, started);
    if (!reconciled) return "skipped" as const;
    // Unpaid Ona Express drafts are booking-session state, never an open
    // request: tapping one returns the customer to the page they were on.
    if (
      (reconciled as unknown as { flowStatus?: string }).flowStatus ===
      "express_pending_payment"
    ) {
      router.back();
      return "skipped" as const;
    }
    commitJob(reconciled);
    // Never clear stickyReleaseErr here only dismiss / successful release
    setErr(stickyReleaseErr ? stickyReleaseErr : null);
    // If payout already done, drop sticky error
    if (
      reconciled.releasedAt ||
      reconciled.escrowStatus === "released" ||
      reconciled.status === "released"
    ) {
      setStickyReleaseErr(null);
    }
    return "ok" as const;
  }, [scope, jobId, commitJob, stickyReleaseErr, accountType, router]); // eslint-disable-line react-hooks/exhaustive-deps
  // Polls, realtime, visibility and guards all use this loader. Share a read
  // for the active job rather than launching parallel copies on slow networks.
  const load = useCallback((trigger: JobTrigger = "unknown"): Promise<void> => {
    const id = activeJobIdRef.current;
    const capture = scope.capture();
    if (!capture) {
      lastOutcomeRef.current = "skipped";
      return Promise.resolve();
    }
    const started = jobRef.current;
    const invalidates = trigger === "realtime" || trigger === "visibility" || trigger === "action";
    if (inFlight.current?.id === id && !invalidates) {
      recordJobDiagnostic("trigger", "job", { source: "job-screen", trigger }, "coalesced");
      return inFlight.current.promise;
    }
    const finish = beginJobDiagnostic("refresh", "job", { source: "job-screen", trigger });
    const promise = loadOnce(trigger).then((outcome) => {
      lastOutcomeRef.current = outcome;
      finish(outcome);
    }).catch((error: unknown) => {
      if (!capture.isCurrent() || activeJobIdRef.current !== id || jobRef.current !== started) {
        lastOutcomeRef.current = "skipped";
        finish("skipped");
        return;
      }
      lastOutcomeRef.current = "http-error";
      finish(diagnosticFailure(error));
      const message = error instanceof Error ? error.message : "Could not refresh job. Retrying…";
      setErr((prev) => stickyReleaseErr || prev || message);
    }).finally(() => {
      if (inFlight.current?.promise === promise) inFlight.current = null;
    });
    inFlight.current = { id, promise };
    return promise;
  }, [scope, activeJobIdRef, jobRef, loadOnce, setErr, stickyReleaseErr]);
  return { load, lastOutcomeRef };
}
