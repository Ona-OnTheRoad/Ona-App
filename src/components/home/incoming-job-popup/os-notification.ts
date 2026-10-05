import {
  canNotify,
  ensureNotifyPermission,
  showAppNotification,
} from "@/lib/app-notify";
import type { MutableRefObject } from "react";
import type { JobRecord } from "@/lib/jobs/types";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import { PRO_SERVICE_LABELS } from "@/lib/services";

/** OS-level push for a freshly surfaced request, once per job id. */
export function showOsNotificationOnce(
  j: JobRecord,
  sent: MutableRefObject<Set<string>>,
): void {
  if (sent.current.has(j.id)) return;
  sent.current.add(j.id);
  const skill = PRO_SERVICE_LABELS[j.serviceType] || j.serviceType || "Job";
  const title =
    isAutomotiveTrade(j.serviceType) && j.motoristVehicle?.trim()
      ? j.motoristVehicle.trim()
      : j.motoristName?.split(/\s+/)[0] || skill;
  void ensureNotifyPermission().then(() => {
    if (canNotify()) {
      showAppNotification({
        title: "Ona · Service Request",
        body: `${title} · ${j.problem.slice(0, 90)}`,
        tag: `job-${j.id}`,
        href: `/jobs/${j.id}`,
        requireInteraction: false,
      });
    }
  });
}
