import {
  canNotify,
  ensureNotifyPermission,
  showAppNotification,
  vibrateCallPattern,
} from "@/lib/app-notify";
import { needsCustomerReleaseConfirm } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { playAppSound, unlockAudio } from "@/lib/sound-tone";
import { isDone, writeLastBuzz } from "./storage";

export function needsRelease(j: JobRecord, motoristId: string): boolean {
  if (!j.id || j.motoristId !== motoristId) return false;
  if (isDone(j.id)) return false;
  return needsCustomerReleaseConfirm(j);
}

export function buzzForJob(job: JobRecord) {
  unlockAudio();
  playAppSound("success_soft");
  vibrateCallPattern();
  void ensureNotifyPermission().then(() => {
    if (canNotify()) {
      showAppNotification({
        title: "Release payment",
        body: "Confirm to release escrow.",
        tag: `job-complete-${job.id}`,
        href: `/jobs/${job.id}`,
        requireInteraction: false,
      });
    }
  });
  writeLastBuzz(job.id, Date.now());
}
