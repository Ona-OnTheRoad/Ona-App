import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInAppCall } from "@/components/call/in-app-call";
import { useNotificationsOptional } from "@/components/notifications/notification-provider";
import { useJobCallout } from "@/lib/callout/use-job-callout";
import { useApp } from "@/lib/store";
import { toastInfo } from "@/lib/toast";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import type { JobViewer } from "./types";
import { useJobActions } from "./use-job-actions";
import { useJobAutoClose } from "./use-job-auto-close";
import { useJobBootstrap } from "./use-job-bootstrap";
import { useJobChatCall } from "./use-job-chat-call";
import { useJobCompletedNotice } from "./use-job-completed-notice";
import { useJobFlowState } from "./use-job-flow-state";
import { useJobGuards } from "./use-job-guards";
import { useJobLoad } from "./use-job-load";
import { useJobPoll } from "./use-job-poll";
import { useJobSweep } from "./use-job-sweep";
import { useNearbyLiveCount } from "./use-nearby-live-count";
import { useNegStatus } from "./use-neg-status";
import { useTripLocationPush } from "./use-trip-location-push";

export interface JobFlowControllerProps {
  jobId: string;
  isLight: boolean;
  viewer: JobViewer;
  actorId: string;
}

/**
 * Owns every hook of the job flow screen (state, loading, polling, actions)
 * and returns the context the stage renderers consume.
 */
export function useJobFlowController({
  jobId,
  isLight,
  viewer,
  actorId,
}: JobFlowControllerProps) {
  const router = useRouter();
  const { startCall } = useInAppCall();
  const notif = useNotificationsOptional();
  const notifRef = useRef(notif);
  notifRef.current = notif;
  const {
    technicians,
    ensureChatForRequestAsync,
    visibleMessageThreads,
    accountType,
    backendUserId,
    authReady,
    isAuthenticated,
    setCategory,
  } = useApp();
  const s = useJobFlowState(jobId);
  const { job, err, flash, setFlash, setChatGateOpen, setChatGateViewHref } = s;
  // Action outcomes are toasts. Kept inline: the load-failure message while
  // there is no job yet, and the release banner on the completed stage.
  useFeedbackToast("", job && job.status !== "completed" ? (err ?? "") : "");
  useEffect(() => {
    if (flash) toastInfo(flash);
  }, [flash]);

  const { openJobChat, startJobCall } = useJobChatCall({
    router,
    startCall,
    viewer,
    technicians,
    ensureChatForRequestAsync,
    visibleMessageThreads,
    setFlash,
    setChatGateOpen,
    setChatGateViewHref,
  });
  useJobAutoClose({
    job,
    viewer,
    router,
    notif,
    setRedirecting: s.setRedirecting,
  });
  const { commitJob } = useJobBootstrap({
    jobId,
    backendUserId,
    accountType,
    authReady,
    isAuthenticated,
    s,
  });
  const { load } = useJobLoad({
    jobId,
    backendUserId,
    isAuthenticated,
    router,
    accountType,
    notifRef,
    commitJob,
    s,
  });
  useJobGuards({ viewer, router, accountType, backendUserId, load, s });
  useJobSweep({ job, authReady, isAuthenticated, load });
  useJobCompletedNotice({ job, viewer, actorId, router, setFlash });
  useJobPoll({
    job,
    authReady,
    isAuthenticated,
    actorId,
    load,
    setErr: s.setErr,
  });
  useNearbyLiveCount(job, viewer, s.setNearbyLiveCount);

  /**
   * Back from the job flow: the pro still has the /jobs inbox; the motorist's
   * "My jobs" page is removed, so their back arrows go straight home.
   */
  const goJobsList = useCallback(() => {
    router.push(viewer === "repair_pro" ? "/jobs" : "/");
  }, [router, viewer]);

  /** After success: motorist home, pro dashboard */
  const goHome = useCallback(() => {
    router.push(viewer === "repair_pro" ? "/dashboard" : "/");
  }, [router, viewer]);

  useTripLocationPush(job, viewer, actorId, s);

  const ink = isLight ? "text-slate-900" : "text-white";
  /** Readable secondary text avoid pale gray on stage */
  const muted = isLight ? "text-slate-700" : "text-white/75";
  const { quote: calloutQuote } = useJobCallout(
    job?.id,
    job?.status,
    job?.calloutQuote,
  );

  const negStatus = useNegStatus(job, viewer, router);
  const { applyJob, cancelRequestInstant, run } = useJobActions({
    viewer,
    actorId,
    router,
    accountType,
    setCategory,
    commitJob,
    load,
    s,
  });

  return {
    ...s,
    router,
    viewer,
    isLight,
    actorId,
    backendUserId,
    setCategory,
    ink,
    muted,
    calloutQuote,
    negStatus,
    commitJob,
    load,
    goJobsList,
    goHome,
    openJobChat,
    startJobCall,
    applyJob,
    cancelRequestInstant,
    run,
  };
}

/** Everything a stage renderer needs (the live job is passed separately). */
export type JobFlowCtx = ReturnType<typeof useJobFlowController>;
