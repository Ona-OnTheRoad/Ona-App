import { useCallback } from "react";
import type { useRouter } from "next/navigation";
import { apiTransition } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import { homePathForForbidden, isForbiddenMessage } from "@/lib/navigation";
import type { useApp } from "@/lib/store";
import type { JobApiResult, JobViewer } from "./types";
import type { JobFlowState } from "./use-job-flow-state";

interface Args {
  viewer: JobViewer;
  actorId: string;
  router: ReturnType<typeof useRouter>;
  accountType: ReturnType<typeof useApp>["accountType"];
  setCategory: ReturnType<typeof useApp>["setCategory"];
  commitJob: (next: JobRecord, force?: boolean) => void;
  load: () => Promise<void>;
  s: JobFlowState;
}

/** Mutating job actions: apply, instant cancel and the guarded `run` wrapper. */
export function useJobActions({
  viewer,
  actorId,
  router,
  accountType,
  setCategory,
  commitJob,
  load,
  s,
}: Args) {
  const {
    jobRef,
    setFlash,
    setConfirmCancel,
    setBusy,
    setErr,
    setRerouteAlert,
  } = s;

  const applyJob = (j: JobRecord) => {
    commitJob(j, true);
    setFlash(null);
  };

  /**
   * Cancel request: close UI instantly (optimistic), API in background.
   * Avoids hanging on network for CANCEL during pairing / negotiate / agreed.
   */
  const cancelRequestInstant = useCallback(
    (actor: "motorist" | "repair_pro") => {
      const j = jobRef.current;
      if (!j) return;
      setConfirmCancel(null);
      setBusy(false);
      setErr(null);
      const ts = new Date().toISOString();
      commitJob(
        {
          ...j,
          status: "cancelled",
          pairingStage: null,
          pairingDeadline: null,
          updatedAt: ts,
          statusHistory: [
            ...(j.statusHistory || []),
            { status: "cancelled", at: ts, by: actor },
          ],
        },
        true,
      );
      // Leave the screen immediately no wait for server
      if (actor === "repair_pro") {
        router.replace("/dashboard");
      } else {
        setCategory("none");
        router.replace("/");
      }
      void apiTransition({
        jobId: j.id,
        event: "CANCEL",
        actor,
        actorId: actorId || undefined,
      })
        .then((res) => {
          if (res.ok) commitJob(res.data.job, true);
        })
        .catch(() => {
          /* optimistic cancel already applied */
        });
    },
    [actorId, commitJob, router, jobRef, setConfirmCancel, setBusy, setErr],
  );

  const run = async (fn: () => Promise<JobApiResult>) => {
    setBusy(true);
    setErr(null);
    const prevStatus = jobRef.current?.status;
    try {
      const res = await fn();
      if (!res.ok) {
        // Raced SSPE action: the pairing sweep already moved this request on
        // (passed to another pro or expired). Reload so the UI shows the real
        // state "Request passed on" / expired instead of a bare error.
        if (
          /Request is not awaiting confirmation|Request is not open for this action|Not assigned to this request/i.test(
            res.message,
          )
        ) {
          setErr(null);
          void load();
          return;
        }
        if (isForbiddenMessage(res.message)) {
          setErr(null);
          router.replace(homePathForForbidden(accountType));
          return;
        }
        setErr(res.message);
        try {
          const { playAppSound } = await import("@/lib/sound-tone");
          playAppSound("error");
        } catch {
          /* */
        }
        return;
      }
      applyJob(res.data.job);
      const next = res.data.job.status;

      // Detect reroute pro cancelled and system found another
      const lastHistory = res.data.job.statusHistory?.at(-1);
      const hasReroute = lastHistory?.by?.startsWith("reroute:");
      const wasCancelled = res.data.job.statusHistory?.some((h) =>
        h.note?.startsWith("pro_declined"),
      );
      if (hasReroute && wasCancelled && viewer === "motorist") {
        const note = res.data.job.statusHistory.find((h) =>
          h.note?.startsWith("pro_declined"),
        );
        setRerouteAlert(note?.note || "pro_declined");
        return;
      }
      try {
        const { playAppSound } = await import("@/lib/sound-tone");
        if (next !== prevStatus) {
          if (next === "agreed") playAppSound("request_accepted");
          else if (next === "paid_booked") playAppSound("payment_success");
          else if (next === "en_route") playAppSound("trip_started");
          else if (next === "arrived") playAppSound("arrived");
          else if (next === "completed" || next === "satisfied")
            playAppSound("job_complete");
          else if (next === "released") playAppSound("job_complete");
          else playAppSound("success_soft");
        } else if (prevStatus === "negotiating") {
          // Offer placed without status change
          playAppSound("offer_sent");
        }
      } catch {
        /* audio optional */
      }
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      if (isForbiddenMessage(msg)) {
        setErr(null);
        router.replace(homePathForForbidden(accountType));
        return;
      }
      setErr(msg);
      try {
        const { playAppSound } = await import("@/lib/sound-tone");
        playAppSound("error");
      } catch {
        /* */
      }
    } finally {
      // Never leave the UI stuck on “Updating…”
      setBusy(false);
    }
  };
  return { applyJob, cancelRequestInstant, run };
}
