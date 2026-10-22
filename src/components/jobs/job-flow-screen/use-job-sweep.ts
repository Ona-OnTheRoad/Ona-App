import { useEffect, useRef } from "react";
import type { JobTrigger } from "@/lib/jobs/diagnostics/types";
import {
  isJobPendingPayoutSettlement,
  jobNeedsImmediateMaintenanceSweep,
  jobNeedsMaintenanceSweep,
} from "@/lib/jobs/maintenance-coordinator";
import type { JobRecord } from "@/lib/jobs/types";

interface Args {
  job: JobRecord | null;
  authReady: boolean;
  isAuthenticated: boolean;
  load: (trigger?: JobTrigger) => Promise<unknown>;
}

/** Client backup: sweep overdue jobs + retry PENDING_SETTLEMENT payouts. */
export function useJobSweep({ job, authReady, isAuthenticated, load }: Args) {
  const jobRef = useRef(job);
  const loadRef = useRef(load);

  useEffect(() => {
    jobRef.current = job;
    loadRef.current = load;
  }, [job, load]);

  const needsSweep = jobNeedsMaintenanceSweep(job);
  const pendingPayout = isJobPendingPayoutSettlement(job);
  const immediateDue = jobNeedsImmediateMaintenanceSweep(job);
  const jobId = job?.id ?? null;

  useEffect(() => {
    if (!authReady || !isAuthenticated || !jobId || !needsSweep) return;
    let cancelled = false;
    const sweep = async (trigger: JobTrigger = "initial") => {
      try {
        const { apiExpireStaleBookedJobs } = await import("@/lib/jobs/client");
        if (cancelled) return;
        const currentJob = jobRef.current;
        const urgent =
          isJobPendingPayoutSettlement(currentJob) ||
          jobNeedsImmediateMaintenanceSweep(currentJob);
        const res = await apiExpireStaleBookedJobs({
          source: "job-screen",
          trigger,
          urgent,
        });
        const wasSkipped =
          Boolean(res && typeof res === "object" && "skipped" in res && res.skipped);
        if (!cancelled && !wasSkipped) {
          await loadRef.current("maintenance");
        }
      } catch {
        /* ignore */
      }
    };
    if (immediateDue) {
      void sweep("initial");
    }
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
  }, [authReady, isAuthenticated, jobId, needsSweep, pendingPayout, immediateDue]);
}
