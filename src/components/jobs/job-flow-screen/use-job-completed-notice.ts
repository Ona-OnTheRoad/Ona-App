import { useEffect, useRef } from "react";
import type { useRouter } from "next/navigation";
import type { JobRecord } from "@/lib/jobs/types";
import type { JobViewer } from "./types";

interface Args {
  job: JobRecord | null;
  viewer: JobViewer;
  actorId: string;
  router: ReturnType<typeof useRouter>;
  setFlash: (v: string | null) => void;
}

/** When the job flips to completed for the customer: re-assert path + notify. */
export function useJobCompletedNotice({
  job,
  viewer,
  actorId,
  router,
  setFlash,
}: Args) {
  // When job flips to completed for customer, force satisfaction UI + notify
  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = job?.status || null;
    if (!job || job.status !== "completed") return;
    const isCustomer =
      (Boolean(actorId) && job.motoristId === actorId) || viewer === "motorist";
    if (!isCustomer) return;
    // Always re-assert path so dual-role / deep links land on release screen
    if (typeof window !== "undefined") {
      const path = `/jobs/${job.id}`;
      if (!window.location.pathname.includes(path)) {
        router.replace(path);
      }
    }
    if (prev && prev !== "completed") {
      try {
        // Short in-app flash only (2s) not sticky
        setFlash("Job complete release payment");
        window.setTimeout(() => setFlash(null), 2000);
        void import("@/lib/app-notify").then(({ showAppNotification }) => {
          showAppNotification({
            title: "Confirm & release pay",
            body: "Job complete tap I am Satisfied to release payment.",
            tag: `job-complete-${job.id}`,
            href: `/jobs/${job.id}`,
            requireInteraction: false,
          });
        });
        void import("@/lib/sound-tone").then(({ playAppSound }) => {
          playAppSound("success_soft");
        });
      } catch {
        /* */
      }
    }
  }, [
    job?.status,
    job?.id,
    job?.motoristId,
    viewer,
    actorId,
    router,
    setFlash,
  ]);
}
