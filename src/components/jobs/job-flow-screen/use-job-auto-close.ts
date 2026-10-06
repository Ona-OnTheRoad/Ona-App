import { useEffect } from "react";
import type { useRouter } from "next/navigation";
import type { useNotificationsOptional } from "@/components/notifications/notification-provider";
import { isJobHistoryOnlyStatus } from "@/lib/chat-expired";
import type { JobRecord } from "@/lib/jobs/types";
import type { JobViewer } from "./types";

interface Args {
  job: JobRecord | null;
  viewer: JobViewer;
  router: ReturnType<typeof useRouter>;
  notif: ReturnType<typeof useNotificationsOptional>;
  setRedirecting: (v: boolean) => void;
}

/** Terminal-status redirect + clearing of this job's unread notifications. */
export function useJobAutoClose({
  job,
  viewer,
  router,
  notif,
  setRedirecting,
}: Args) {
  /* Auto-close: terminal status → customer & pro both go straight to their
   * dashboard (no summary page). A pro whose request has been passed to another
   * pro stays on the explicit "Request passed on" screen (see SSPE block). */
  useEffect(() => {
    if (!job) return;
    const isPro = viewer === "repair_pro";
    // Exhausted requests (no pro available after all rounds) must keep showing
    // the explicit "No pro available / Request again" screen including after
    // a refresh instead of auto-closing to the dashboard.
    const isExhausted = job.statusHistory.some(
      (h) => h.by === "pairing_exhausted" || h.by === "reroute_exhausted",
    );
    if (isExhausted) return;
    if (isJobHistoryOnlyStatus(job.status)) {
      const path = window.location.pathname || "";
      if (path.startsWith("/jobs/")) {
        setRedirecting(true);
        router.replace(isPro ? "/dashboard" : "/");
      }
    }
  }, [job, viewer, router, setRedirecting]);

  // Opening a job clears its pending Service Request notifications so the
  // unread badge (bell) doesn't stay stuck after the pro has read the request.
  useEffect(() => {
    if (!job || !notif) return;
    const ids = notif.notifications
      .filter((n) => !n.readAt && n.jobId === job.id)
      .map((n) => n.id);
    if (ids.length) void notif.markRead(ids);
  }, [job?.id, notif?.notifications, notif?.markRead]); // eslint-disable-line react-hooks/exhaustive-deps
}
