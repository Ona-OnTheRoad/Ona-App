"use client";

import { useEffect, useRef } from "react";
import { apiGetJob } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import type { Phase } from "./types";

const POLL_MS = 4000;
const WATCHED: ReadonlySet<Phase> = new Set(["summary", "paying", "bank_pay", "mock_embed"]);

/**
 * While any payment screen is open, watch the job. If the Service Pro (or anyone)
 * cancels it, tell the checkout so it can stop asking the customer to pay. Without
 * this the "Finish payment" screen, including the bank-transfer account number,
 * stayed up on a job that was already cancelled.
 */
export function useCheckoutLiveStatus(
  phase: Phase,
  jobId: string,
  onCancelled: (job: JobRecord) => void,
) {
  const cb = useRef(onCancelled);
  useEffect(() => {
    cb.current = onCancelled;
  });
  useEffect(() => {
    if (!jobId || !WATCHED.has(phase)) return;
    let stopped = false;
    let id = 0;
    const check = async () => {
      if (stopped) return;
      try {
        const res = await apiGetJob(jobId, { source: "checkout", trigger: "interval" });
        if (stopped || !res.ok || !res.data.job) return;
        if (res.data.job.status === "cancelled") {
          stopped = true;
          window.clearInterval(id);
          cb.current(res.data.job);
        }
      } catch {
        /* keep watching */
      }
    };
    id = window.setInterval(() => void check(), POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [phase, jobId]);
}
