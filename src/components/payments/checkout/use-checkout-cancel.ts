"use client";

import { useState } from "react";
import { cancelJobConfirmed } from "@/lib/jobs/cancel-job";
import type { JobRecord } from "@/lib/jobs/types";

type Router = { replace: (href: string) => void };

export function useCheckoutCancel({
  job,
  actorId,
  router,
  resetPayTimerOnCancel,
}: {
  job: JobRecord | null;
  actorId: string;
  router: Router;
  resetPayTimerOnCancel: () => Promise<void>;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busyCancel, setBusyCancel] = useState(false);
  const [confirmCancelRequest, setConfirmCancelRequest] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const cancelPaymentOnly = () => {
    setCancelOpen(false);
    void resetPayTimerOnCancel().then(() => {
      router.replace("/");
    });
  };

  const cancelEntireRequest = async () => {
    if (!job || !actorId) {
      cancelPaymentOnly();
      return;
    }
    setBusyCancel(true);
    setCancelError(null);
    // Only leave once the server confirms the request is closed. Leaving on a
    // failed CANCEL kept the request alive and resumable from the home screen.
    const res = await cancelJobConfirmed({
      jobId: job.id,
      actor: "motorist",
      actorId,
    });
    setBusyCancel(false);
    if (!res.ok) {
      setCancelError(res.message);
      return;
    }
    setCancelOpen(false);
    router.replace("/");
  };

  return {
    cancelOpen,
    setCancelOpen,
    busyCancel,
    cancelError,
    confirmCancelRequest,
    setConfirmCancelRequest,
    cancelPaymentOnly,
    cancelEntireRequest,
  };
}
