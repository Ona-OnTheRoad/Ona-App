"use client";

import { useState } from "react";
import { apiTransition } from "@/lib/jobs/client";
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
    try {
      await apiTransition({
        jobId: job.id,
        event: "CANCEL",
        actor: "motorist",
        actorId,
      });
    } catch {
      /* still leave */
    }
    setBusyCancel(false);
    setCancelOpen(false);
    router.replace("/");
  };

  return {
    cancelOpen,
    setCancelOpen,
    busyCancel,
    confirmCancelRequest,
    setConfirmCancelRequest,
    cancelPaymentOnly,
    cancelEntireRequest,
  };
}
