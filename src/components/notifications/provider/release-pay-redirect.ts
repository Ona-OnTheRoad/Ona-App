import type { AppNotification } from "@/lib/notifications/types";

/** Force customer onto release-pay job page (not toast-only). */
export function redirectToReleasePayIfNeeded(n: AppNotification): void {
  try {
    const st = String(n.jobStatus || "").toLowerCase();
    const href = n.href || (n.jobId ? `/jobs/${n.jobId}` : "");
    const releasePay =
      st === "completed" &&
      href.includes("/jobs/") &&
      (n.actionType === "open_job" ||
        n.actionType === "view_payment" ||
        n.category === "payments");
    if (
      releasePay &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes(
        `/jobs/${n.jobId || href.split("/jobs/")[1]?.split("?")[0] || ""}`,
      )
    ) {
      window.location.assign(href.startsWith("/") ? href : `/${href}`);
    }
  } catch {
    /* soft navigate optional */
  }
}
