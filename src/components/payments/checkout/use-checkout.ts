"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiCancelPaySession, apiGetJob, apiPayJob } from "@/lib/jobs/client";
import { PAYMENT_WINDOW_MS } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { logPayGate } from "@/lib/pay-telemetry";
import { canEmbedCheckoutInApp } from "@/lib/payments/open-checkout";
import { useApp } from "@/lib/store";
import { isJobPayable, isPaidOrLiveStatus } from "../shared/job-status";
import { buildBankTransferInfo } from "./build-bank-transfer";
import { evaluatePayPreflight } from "./pay-preflight";
import type { BankTransferInfo, Phase } from "./types";
import { useBankPayPoll } from "./use-bank-pay-poll";
import { useCheckoutCancel } from "./use-checkout-cancel";
import { useCheckoutDerived } from "./use-checkout-derived";
import { useCopyField } from "./use-copy-field";
import { usePayGateTelemetry } from "./use-pay-gate-telemetry";

/** All checkout state, effects and pay/cancel actions. */
export function useCheckout() {
  const router = useRouter();
  const params = useSearchParams();
  const jobId = params.get("jobId") || params.get("job") || "";
  const { backendUserId, userProfile, isAuthenticated, authReady } = useApp();

  const [job, setJob] = useState<JobRecord | null>(null);
  const [phase, setPhase] = useState<Phase>("summary");
  const [err, setErr] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [sessionEndsAt, setSessionEndsAt] = useState<string | null>(null);
  const [bankPay, setBankPay] = useState<BankTransferInfo | null>(null);

  const actorId =
    backendUserId || userProfile?.identityId || userProfile?.email || "";

  useEffect(() => {
    if (!jobId) {
      setErr("Missing job.");
      setPhase("error");
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await apiGetJob(jobId);
      if (cancelled) return;
      if (!res.ok || !res.data.job) {
        setErr(res.ok ? "Job not found." : res.message);
        setPhase("error");
        return;
      }
      const j = res.data.job;
      setJob(j);
      // Already paid leave checkout, never show Pay again
      if (isPaidOrLiveStatus(j.status)) {
        router.replace(`/jobs/${j.id}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, router]);

  usePayGateTelemetry(job, phase, authReady, isAuthenticated);
  useBankPayPoll(phase, jobId, router, reference);

  const derived = useCheckoutDerived(job, sessionEndsAt);
  const { copied, copyField } = useCopyField();

  const onPaymentExpired = useCallback(() => {
    setPayUrl(null);
    setReference(null);
    setSessionEndsAt(null);
    setBankPay(null);
    setErr(null);
    setPhase("expired");
    if (jobId) {
      void apiGetJob(jobId).then((res) => {
        if (res.ok && res.data.job) setJob(res.data.job);
      });
      void import("@/lib/jobs/client").then(({ apiExpireStaleBookedJobs }) =>
        apiExpireStaleBookedJobs().catch(() => null),
      );
    }
  }, [jobId]);

  /**
   * Cancel open pay session: does not count as attempt; clears timer so next Pay
   * starts a fresh 20 minutes.
   */
  const resetPayTimerOnCancel = useCallback(async () => {
    setPayUrl(null);
    setReference(null);
    setSessionEndsAt(null);
    setBankPay(null);
    setPhase("summary");
    setErr(null);
    if (!jobId) return;
    const mid =
      (backendUserId && backendUserId.length > 10 ? backendUserId : null) ||
      job?.motoristId ||
      actorId;
    if (!mid || mid === "local-user") return;
    try {
      const res = await apiCancelPaySession({
        jobId,
        motoristId: mid,
      });
      if (res.ok && res.data.job) {
        setJob(res.data.job);
      } else {
        const fresh = await apiGetJob(jobId);
        if (fresh.ok && fresh.data.job) setJob(fresh.data.job);
      }
    } catch {
      const fresh = await apiGetJob(jobId);
      if (fresh.ok && fresh.data.job) setJob(fresh.data.job);
    }
  }, [jobId, backendUserId, job?.motoristId, actorId]);

  const startPay = useCallback(async () => {
    // Prefer latest job snapshot
    let current = job;
    if (jobId) {
      const fresh = await apiGetJob(jobId);
      if (fresh.ok && fresh.data.job) {
        current = fresh.data.job;
        setJob(current);
      }
    }
    if (!current) {
      void logPayGate("job-missing", { jobId: jobId || null });
      setErr("Job not found. Go back and open pay again.");
      setPhase("expired");
      return;
    }

    // Already paid / in progress → live job
    if (isPaidOrLiveStatus(current.status)) {
      void logPayGate("already-paid", {
        jobId: current.id,
        status: current.status,
      });
      router.replace(`/jobs/${current.id}`);
      return;
    }

    // agreed | cancelled | expired with price → server re-opens to agreed + new pay link
    const canPay = isJobPayable(current);

    if (!canPay) {
      void logPayGate("not-payable", {
        jobId: current.id,
        status: current.status,
        agreedMajor: current.agreedMajor,
      });
      setErr("This job is not ready for payment.");
      setPhase("expired");
      return;
    }

    setErr(null);
    setPayUrl(null);
    setBankPay(null);
    setPhase("paying");
    try {
      const pre = evaluatePayPreflight({
        current,
        profileEmail: userProfile?.email,
        backendUserId,
        actorId,
      });
      if (!pre.ok) {
        void logPayGate(pre.gate, pre.detail);
        setErr(pre.message);
        setPhase("expired");
        return;
      }
      const { payEmail, payerId } = pre;
      const res = await apiPayJob({
        jobId: current.id,
        motoristId: current.motoristId || payerId,
        email: payEmail,
        customerName:
          current.motoristName || userProfile?.fullName || undefined,
        customerPhone: current.motoristPhone || userProfile?.phone || undefined,
        preferInline: true,
      });
      if (!res.ok) {
        // Failed to start pay NOT a used 20‑min window
        void logPayGate("pay-start-failed", {
          jobId: current.id,
          message: res.message || null,
        });
        setErr(res.message || "Could not start payment. Try again.");
        setPhase("summary");
        setSessionEndsAt(null);
        setBankPay(null);
        return;
      }
      if ((res.data as { alreadyPaid?: boolean }).alreadyPaid) {
        router.replace(`/jobs/${current.id}`);
        return;
      }
      const url = (res.data.authorizationUrl || "").trim();
      const ref = (res.data.reference || "").trim();
      setReference(ref || null);
      const ends =
        res.data.paymentSessionEndsAt ||
        new Date(Date.now() + PAYMENT_WINDOW_MS).toISOString();
      setSessionEndsAt(ends);

      const again = await apiGetJob(current.id);
      if (again.ok && again.data.job) setJob(again.data.job);

      if (!ref) {
        setErr("Payment session missing. Tap Pay again.");
        setPhase("expired");
        return;
      }

      setPayUrl(url || null);

      // Dev mock only
      if (url && canEmbedCheckoutInApp(url)) {
        setPhase("mock_embed");
        return;
      }

      // Prefer bank details (any truthy account number)
      const info = buildBankTransferInfo(
        res.data.bankTransfer,
        current.agreedMajor,
      );
      if (info) {
        setBankPay(info);
        setPhase("bank_pay");
        return;
      }

      setErr(
        "Could not create bank transfer details. Tap Pay again in a moment.",
      );
      setPhase("summary");
      setSessionEndsAt(null);
      void resetPayTimerOnCancel();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Payment failed");
      setPhase("expired");
    }
  }, [
    job,
    jobId,
    actorId,
    backendUserId,
    userProfile,
    router,
    resetPayTimerOnCancel,
  ]);

  const cancel = useCheckoutCancel({
    job,
    actorId,
    router,
    resetPayTimerOnCancel,
  });

  return {
    router,
    jobId,
    job,
    setJob,
    phase,
    setPhase,
    err,
    setErr,
    payUrl,
    setPayUrl,
    reference,
    setSessionEndsAt,
    bankPay,
    copied,
    copyField,
    ...derived,
    onPaymentExpired,
    resetPayTimerOnCancel,
    startPay,
    ...cancel,
  };
}
