import type { JobTrigger } from "@/lib/jobs/diagnostics/types";
import { useEffect } from "react";
import type { JobRecord } from "@/lib/jobs/types";

interface Args {
  job: JobRecord | null;
  authReady: boolean;
  isAuthenticated: boolean;
  load: (trigger?: JobTrigger) => Promise<void>;
}

/** Client backup: sweep overdue jobs + retry PENDING_SETTLEMENT payouts. */
export function useJobSweep({ job, authReady, isAuthenticated, load }: Args) {
  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    let cancelled = false;
    const pendingPayout =
      job?.status === "satisfied" ||
      job?.escrowStatus === "pending_settlement" ||
      job?.escrowStatus === "release_pending";
    const sweep = async (trigger: JobTrigger = "initial") => {
      try {
        const { apiExpireStaleBookedJobs } = await import("@/lib/jobs/client");
        if (cancelled) return;
        await apiExpireStaleBookedJobs({ source: "job-screen", trigger });
        if (!cancelled) await load("maintenance");
      } catch {
        /* ignore */
      }
    };
    void sweep();
    // PENDING_SETTLEMENT: poll moderately; otherwise rare backup only
    const intervalMs = pendingPayout ? 45_000 : 180_000;
    const t = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void sweep("interval");
    }, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [load, job?.status, job?.escrowStatus, authReady, isAuthenticated]);
}
