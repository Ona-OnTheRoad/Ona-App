import type { JobTrigger } from "@/lib/jobs/diagnostics/types";
import { useEffect } from "react";
import type { useRouter } from "next/navigation";
import {
  clearJobShown,
  isProPanelOnlyPairingStatus,
  requestForceIncomingPanel,
} from "@/lib/jobs/incoming-popup-timing";
import { homePathForForbidden, isForbiddenMessage } from "@/lib/navigation";
import { logPayGate } from "@/lib/pay-telemetry";
import type { useApp } from "@/lib/store";
import type { JobViewer } from "./types";
import type { JobFlowState } from "./use-job-flow-state";

interface Args {
  viewer: JobViewer;
  router: ReturnType<typeof useRouter>;
  accountType: ReturnType<typeof useApp>["accountType"];
  backendUserId: ReturnType<typeof useApp>["backendUserId"];
  load: (trigger?: JobTrigger) => Promise<void>;
  s: JobFlowState;
}

/** Stale-tab reconcile, forbidden bounce, pro panel bounce, busy telemetry. */
export function useJobGuards({
  viewer,
  router,
  accountType,
  backendUserId,
  load,
  s,
}: Args) {
  const { job, err, setErr, busy } = s;
  // Stale-tab reconcile: while a live negotiation screen is open, re-verify
  // against the server periodically and on refocus. A cancelled/expired job
  // must never keep showing live negotiation controls from an old copy.
  useEffect(() => {
    if (job?.status !== "negotiating") return;
    const onInterval = () => void load("interval");
    const onFocus = () => void load("focus");
    const onVisibility = () => void load("visibility");
    const iv = window.setInterval(onInterval, 20_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [job?.status, load]);

  // If Forbidden ever lands in UI state, leave immediately (no stuck screen)
  useEffect(() => {
    if (!err || !isForbiddenMessage(err)) return;
    setErr(null);
    router.replace(homePathForForbidden(accountType));
  }, [err, accountType, router, setErr]);

  // Pro pairing request = lower panel only. Never keep a full /jobs page.
  // Bounce to dashboard and force the incoming panel to open.
  useEffect(() => {
    if (viewer !== "repair_pro" || !job) return;
    if (!isProPanelOnlyPairingStatus(job.status)) return;
    try {
      clearJobShown(job.id, backendUserId || undefined);
      requestForceIncomingPanel(job.id);
    } catch {
      /* */
    }
    router.replace("/dashboard");
  }, [viewer, job?.id, job?.status, backendUserId, router]);

  // Telemetry: if `busy` sticks true > 5s every job CTA (incl. "Pay now to
  // book") renders disabled and taps do nothing. Log once so we can tell a
  // dead tap from a stuck-updating flag.
  useEffect(() => {
    if (!busy || !job) return;
    const t = window.setTimeout(() => {
      if (busy) {
        void logPayGate("busy-stuck", {
          jobId: job.id,
          status: job.status,
          viewer,
        });
      }
    }, 5000);
    return () => window.clearTimeout(t);
  }, [busy, job, viewer]);
}
