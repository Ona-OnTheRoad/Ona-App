"use client";

/**
 * Repair Pro: lower-panel Incoming Request only (no top toast).
 * - Instant surface: poll + Supabase realtime
 * - Up to 2 requests visible at once (full cards, panel expands no shrink/scroll)
 * - Further jobs queue; when a slot frees, next promotes instantly
 * - 66s progress per card (server pairing_deadline)
 * - OS push kept alongside in-app panel
 * - No dim scrim panel only; cannot dismiss by outside tap or Escape
 * (timer elapse or Decline / Later / I can fix this only)
 *
 * Thin composition file: hooks, helpers and presentational pieces live in
 * ./incoming-job-popup/.
 */

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { ConfirmCancelSheet } from "@/components/ui/confirm-cancel-sheet";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MAX_VISIBLE_INCOMING } from "./incoming-job-popup/constants";
import { sendDecline } from "./incoming-job-popup/helpers";
import { CloseBanner } from "./incoming-job-popup/close-banner";
import { ConfirmFixDialog } from "./incoming-job-popup/confirm-fix-dialog";
import { IncomingPanel } from "./incoming-job-popup/incoming-panel";
import { PhotoLightbox } from "./incoming-job-popup/photo-lightbox";
import { SnoozedDialog } from "./incoming-job-popup/snoozed-dialog";
import type { PanelLevel } from "./incoming-job-popup/types";
import { useFixIt } from "./incoming-job-popup/use-fix-it";
import { useIncomingCountdown } from "./incoming-job-popup/use-incoming-countdown";
import { useIncomingPanel } from "./incoming-job-popup/use-incoming-panel";
import { useIncomingPoll } from "./incoming-job-popup/use-incoming-poll";
import { useIncomingQueue } from "./incoming-job-popup/use-incoming-queue";
import { useIncomingState } from "./incoming-job-popup/use-incoming-state";

export { INCOMING_POPUP_STATUS_POLL_MS } from "./incoming-job-popup/constants";

export function IncomingJobPopup() {
  const { accountType, backendUserId, theme, isAuthenticated, authReady } =
    useApp();
  const isLight = theme === "light";
  const router = useRouter();
  const pathname = usePathname() || "";

  // The panel opens at the MIDDLE level on an incoming request and never
  // auto-minimizes. Swipe up / flip → full (all Q&A, 77% of the shell); swipe
  // down steps back one level: full → middle → collapsed (5%-height peek).
  // Tap on the collapsed strip reopens the middle. Jobs still clear instantly
  // on decline / cancel / timer expiry at any level (existing poll + 250ms
  // expiry interval).
  const [level, setLevel] = useState<PanelLevel>("middle");

  const state = useIncomingState({
    backendUserId,
    isAuthenticated,
    authReady,
    router,
  });
  const { presentJob, offerJob, removeJobAndMaybeNext, removeRef } =
    useIncomingQueue({ backendUserId, router, state });
  const handleFixIt = useFixIt({ backendUserId, router, state, removeRef });
  useIncomingCountdown({ state, removeRef });
  useIncomingPoll({
    accountType,
    backendUserId,
    isAuthenticated,
    authReady,
    pathname,
    state,
    removeRef,
    presentJob,
    offerJob,
    setLevel,
  });

  const {
    visibleJobs,
    otherCount,
    confirmFix,
    setConfirmFix,
    confirmCancelFix,
    setConfirmCancelFix,
    acceptingId,
    snoozedJob,
    setSnoozedJob,
    actionError,
    closeBanner,
    setCloseBanner,
    timeLeftById,
    lightbox,
    setLightbox,
  } = state;

  const showBadge =
    accountType === "professional" &&
    otherCount > MAX_VISIBLE_INCOMING &&
    pathname.startsWith("/jobs/") &&
    visibleJobs.length === 0;

  const panelOpen = visibleJobs.length > 0 && !snoozedJob;

  const gesture = useIncomingPanel({ level, setLevel, panelOpen });

  if (accountType !== "professional") return null;

  const solid = isLight ? "#ffffff" : "#1c1c1e";
  const ink = isLight ? "#0f1419" : "#e7e9ea";
  const muted = isLight ? "#536471" : "#71767b";
  const hairline = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  return (
    <>
      {showBadge && (
        <button
          type="button"
          onClick={() => router.push("/jobs")}
          className={cn(
            "absolute right-3 top-[max(0.6rem,env(safe-area-inset-top))] z-[160] flex items-center gap-1.5 rounded-full border-0 px-2.5 py-1.5 text-[11px] font-bold shadow-md",
            isLight ? "bg-slate-900 text-white" : "bg-[#FF6B35] text-white",
          )}
        >
          <Briefcase className="h-3.5 w-3.5" />
          {otherCount} open
        </button>
      )}

      {/* No dim scrim panel only. Outside taps do nothing (no dismiss layer). */}

      {panelOpen && (
        <IncomingPanel
          gesture={gesture}
          level={level}
          onExpandFromCollapsed={() => setLevel("middle")}
          visibleJobs={visibleJobs}
          timeLeftById={timeLeftById}
          acceptingId={acceptingId}
          backendUserId={backendUserId}
          actionError={actionError}
          isLight={isLight}
          solid={solid}
          ink={ink}
          muted={muted}
          hairline={hairline}
          onOpenPhotos={setLightbox}
          onDecline={(job) => {
            removeJobAndMaybeNext(job.id, { defer: false });
            void sendDecline(job, backendUserId);
          }}
          onConfirm={setConfirmFix}
        />
      )}

      {snoozedJob && (
        <SnoozedDialog
          isLight={isLight}
          onDismiss={() => setSnoozedJob(null)}
        />
      )}

      {confirmFix && (
        <ConfirmFixDialog
          confirmFix={confirmFix}
          isLight={isLight}
          acceptingId={acceptingId}
          onCancel={() => setConfirmCancelFix(true)}
          onConfirm={(j) => {
            setConfirmFix(null);
            void handleFixIt(j);
          }}
        />
      )}

      <ConfirmCancelSheet
        open={confirmCancelFix}
        isLight={isLight}
        title="Decline this job?"
        message="You won't accept this job as a Repair Pro."
        confirmLabel="Yes, decline"
        keepLabel="Keep"
        onClose={() => setConfirmCancelFix(false)}
        onConfirm={() => {
          setConfirmCancelFix(false);
          setConfirmFix(null);
        }}
      />

      {lightbox && (
        <PhotoLightbox lightbox={lightbox} setLightbox={setLightbox} />
      )}

      {closeBanner && (
        <CloseBanner
          closeBanner={closeBanner}
          isLight={isLight}
          onOpenJobs={() => {
            setCloseBanner(null);
            router.push("/jobs");
          }}
          onDismiss={() => setCloseBanner(null)}
        />
      )}
    </>
  );
}
