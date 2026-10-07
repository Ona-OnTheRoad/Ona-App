"use client";

import { useEffect } from "react";
import { authFetch } from "@/lib/api-auth-headers";
import { apiGetJob } from "@/lib/jobs/client";
import { isBookedOrActiveStatus } from "../shared/job-status";
import type { Phase } from "./types";

type Router = { replace: (href: string) => void };

/**
 * While bank-transfer screen is open, poll until booked + re-verify reference.
 */
export function useBankPayPoll(
  phase: Phase,
  jobId: string,
  router: Router,
  reference: string | null,
) {
  useEffect(() => {
    if (phase !== "bank_pay" && phase !== "mock_embed") return;
    if (!jobId) return;
    const poll = window.setInterval(() => {
      void (async () => {
        if (reference) {
          try {
            await authFetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reference,
                jobId,
              }),
            });
          } catch {
            /* keep polling */
          }
        }
        const res = await apiGetJob(jobId);
        if (!res.ok || !res.data.job) return;
        const st = res.data.job.status;
        if (isBookedOrActiveStatus(st)) {
          window.clearInterval(poll);
          router.replace(`/jobs/${jobId}`);
        }
      })();
    }, 4000);
    return () => window.clearInterval(poll);
  }, [phase, jobId, router, reference]);
}
