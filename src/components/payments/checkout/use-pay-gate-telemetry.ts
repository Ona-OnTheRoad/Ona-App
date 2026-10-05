"use client";

import { useEffect, useRef } from "react";
import type { JobRecord } from "@/lib/jobs/types";
import { logPayGate } from "@/lib/pay-telemetry";
import { isJobPayable } from "../shared/job-status";
import type { Phase } from "./types";

/**
 * Telemetry: when the Pay button would render disabled after the job loads,
 * log which gate keeps it inert, once per job. This turns "Pay not clicking"
 * into a visible branch in /admin/health + the console.
 */
export function usePayGateTelemetry(
  job: JobRecord | null,
  phase: Phase,
  authReady: boolean,
  isAuthenticated: boolean,
) {
  const lastPayDisabledLoggedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!job || phase !== "summary" || !authReady || !isAuthenticated) return;
    if (isJobPayable(job)) return;
    if (lastPayDisabledLoggedFor.current === job.id) return;
    lastPayDisabledLoggedFor.current = job.id;
    void logPayGate("pay-disabled-render", {
      jobId: job.id,
      status: job.status,
      agreedMajor: job.agreedMajor,
    });
  }, [job, phase, authReady, isAuthenticated]);
}
