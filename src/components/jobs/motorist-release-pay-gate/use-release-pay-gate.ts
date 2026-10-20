import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiListJobs, apiTransition } from "@/lib/jobs/client";
import { SATISFIED_REMINDER_INTERVAL_MS } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import {
  buildCustomerChargeMajor,
  formatMoney,
  forceNairaCurrency,
} from "@/lib/pricing";
import { useJobCallout } from "@/lib/callout/use-job-callout";
import {
  getDisplayTotalMajor,
  jobCalloutQuoteOf,
  jobChargeParts,
  jobEscrowAmountMinor,
} from "@/lib/callout/payable";
import { playAppSound, unlockAudio } from "@/lib/sound-tone";
import { useApp } from "@/lib/store";
import { buzzForJob, needsRelease } from "./release-helpers";
import type { ReleaseReceiptData } from "./release-receipt";
import {
  ALERTED_KEY,
  isMinimized,
  markAlerted,
  markDone,
  readLastBuzz,
  readSet,
  setMinimized,
} from "./storage";

/** State, polling and release handlers for MotoristReleasePayGate. */
export function useReleasePayGate() {
  const { backendUserId, isAuthenticated, theme } = useApp();
  const isLight = theme === "light";
  const router = useRouter();
  const pathname = usePathname() || "";
  const knownCompleted = useRef<Set<string>>(new Set());
  const lastSweepRef = useRef(0);
  const [pending, setPending] = useState<JobRecord | null>(null);
  const [minimized, setMinimizedUi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [receipt, setReceipt] = useState<ReleaseReceiptData | null>(null);

  const { quote: calloutQuote, ready: calloutReady } = useJobCallout(
    pending?.id,
    pending?.status,
    pending?.calloutQuote,
  );

  // Single source: Total = labour + callout (via helper), not just labour
  const pendingTotal = (() => {
    if (pending == null) return null;
    return getDisplayTotalMajor({
      agreedMajor: pending.agreedMajor,
      amountMinor: jobEscrowAmountMinor(pending),
      quote: calloutQuote,
      fallbackQuote: jobCalloutQuoteOf(pending),
    });
  })();

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !backendUserId) {
      setPending(null);
      return;
    }
    // Soft sweep never re-open UI for done jobs.
    // Data saver: the expire-stale POST is heavy (server DB sweep), so throttle
    // it to ~2 min even though the list poll runs more often.
    const now = Date.now();
    if (now - lastSweepRef.current >= 120_000) {
      lastSweepRef.current = now;
      try {
        const { apiExpireStaleBookedJobs } = await import("@/lib/jobs/client");
        await apiExpireStaleBookedJobs();
      } catch {
        /* */
      }
    }

    const res = await apiListJobs(backendUserId, "motorist");
    if (!res.ok) return;

    // Permanently silence finished / already-confirmed jobs
    for (const j of res.data.jobs) {
      if (j.motoristId !== backendUserId) continue;
      if (
        j.status === "released" ||
        j.status === "satisfied" ||
        j.status === "refunded" ||
        j.releasedAt ||
        j.satisfiedAt ||
        j.escrowStatus === "released"
      ) {
        markDone(j.id);
      }
    }

    const needs = res.data.jobs
      .filter((j) => needsRelease(j, backendUserId))
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      );

    const top = needs[0] || null;
    if (!top) {
      setPending(null);
      return;
    }

    const firstSighting = !knownCompleted.current.has(top.id);
    if (firstSighting) knownCompleted.current.add(top.id);

    setPending(top);
    const min = isMinimized(top.id);
    setMinimizedUi(min);

    // Alert only once per job never re-spam full modal every poll
    if (firstSighting && !readSet(ALERTED_KEY).has(top.id)) {
      markAlerted(top.id);
      buzzForJob(top);
    }

    // Hourly gentle buzz only if still minimized (does not force full modal open)
    const last = readLastBuzz(top.id);
    if (min && Date.now() - last >= SATISFIED_REMINDER_INTERVAL_MS) {
      buzzForJob(top);
    }
  }, [backendUserId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !backendUserId) {
      setPending(null);
      return;
    }
    let cancelled = false;
    let polling = false;
    const poll = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (cancelled || polling) return;
      polling = true;
      try {
        await refresh();
      } catch {
        // A failed background read must not clear an existing release prompt.
        // Leave the current state intact and retry on the next poll.
      } finally {
        polling = false;
      }
    };
    void poll();
    const t = window.setInterval(() => {
      void poll();
    }, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [backendUserId, isAuthenticated, refresh]);

  const onMinimize = () => {
    if (!pending) return;
    setMinimized(pending.id, true);
    setMinimizedUi(true);
  };

  const onExpand = () => {
    if (!pending) return;
    setMinimized(pending.id, false);
    setMinimizedUi(false);
  };

  const onSatisfied = () => {
    if (!pending) return;
    const actor =
      (pending.motoristId && pending.motoristId.length > 10
        ? pending.motoristId
        : null) ||
      (backendUserId && backendUserId.length > 10 ? backendUserId : null);
    if (!actor) {
      setErr("Sign in as the customer who booked this job to release payment.");
      return;
    }
    const jobId = pending.id;

    // Instant confirm: show “Released” right away and clear the modal (and the
    // 6h auto-release countdown it carries). The transfer runs in the
    // background; the job shell we land on reconciles with the real payout.
    const currency = forceNairaCurrency(pending.currency);
    const parts = jobChargeParts({
      agreedMajor: pending.agreedMajor,
      amountMinor: jobEscrowAmountMinor(pending),
      quote: calloutQuote,
      fallbackQuote: jobCalloutQuoteOf(pending),
    });
    const displayTotal =
      parts?.totalMajor ??
      getDisplayTotalMajor({
        agreedMajor: pending.agreedMajor,
        amountMinor: jobEscrowAmountMinor(pending),
        quote: calloutQuote,
        fallbackQuote: jobCalloutQuoteOf(pending),
      });
    const total = displayTotal ?? 0;
    const calloutMajor = parts?.calloutMajor ?? 0;
    const labourMajor = parts?.labourMajor ?? pending.agreedMajor ?? 0;
    // Pro receives 87.5% of labour + 100% call-out (matches server payout-settlement)
    const labourSplit = buildCustomerChargeMajor(labourMajor);
    const proShare =
      Math.round((labourSplit.proPayoutMajor + calloutMajor) * 100) / 100;
    const platformShare = Math.round(labourSplit.platformFeeMajor * 100) / 100;

    markDone(jobId);
    setMinimized(jobId, false);
    setBusy(false);
    setErr(null);
    unlockAudio();
    playAppSound("payment_success");
    setReceipt({
      amount: formatMoney(total, currency),
      pro: formatMoney(proShare, currency),
      platform: formatMoney(platformShare, currency),
      note: "Payment confirmed releasing your Repair Pro's pay.",
    });
    setSuccess(true);
    setPending(null);
    window.setTimeout(() => {
      router.replace(`/jobs/${jobId}`);
    }, 900);

    // Fire-and-reconcile: server owns the truth. On failure the job shell we
    // land on shows the real status and lets the customer retry/dispute.
    void apiTransition({
      jobId,
      event: "SATISFIED",
      actor: "motorist",
      actorId: actor,
    }).catch(() => {
      /* job shell re-fetch reconciles */
    });
  };

  return {
    backendUserId,
    isLight,
    pathname,
    pending,
    minimized,
    busy,
    err,
    setErr,
    success,
    receipt,
    pendingTotal,
    calloutQuote,
    onMinimize,
    onExpand,
    onSatisfied,
  };
}
