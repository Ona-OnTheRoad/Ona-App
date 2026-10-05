"use client";

import { isPayoutPendingSettlement } from "@/lib/jobs/constants";
import { renderAgreedStage } from "./job-flow-screen/agreed-stage";
import {
  renderLoadingStage,
  renderRedirectingStage,
  renderScheduledStage,
  renderSearchingStage,
} from "./job-flow-screen/basic-stages";
import {
  renderCancelledStage,
  renderDisputedStage,
  renderPendingSettlementStage,
} from "./job-flow-screen/closing-stages";
import { renderCompletedStage } from "./job-flow-screen/completed-stage";
import { renderExpiredStage } from "./job-flow-screen/expired-stage";
import { renderNegotiatingStage } from "./job-flow-screen/negotiating-stage";
import { renderPairingStage } from "./job-flow-screen/pairing-stage";
import { renderReleasedStage } from "./job-flow-screen/released-stage";
import { renderTrackingStage } from "./job-flow-screen/tracking-stage";
import { useJobFlowController } from "./job-flow-screen/use-job-flow-controller";

export function JobFlowScreen({
  jobId,
  isLight,
  viewer,
  actorId,
}: {
  jobId: string;
  isLight: boolean;
  viewer: "motorist" | "repair_pro";
  actorId: string;
  email?: string;
}) {
  const c = useJobFlowController({ jobId, isLight, viewer, actorId });
  const { job, redirecting, negStatus } = c;

  if (!job) return renderLoadingStage(c);
  if (redirecting) return renderRedirectingStage(c);

  if (job.status === "expired" || negStatus === "expired") {
    return renderExpiredStage(c, job);
  }
  if (job.status === "scheduled") return renderScheduledStage(c, job);

  if (
    job.status === "waiting_for_selected" ||
    job.status === "selected_review" ||
    job.status === "sequential_pairing" ||
    job.status === "waiting_for_pro" ||
    job.status === "reserved"
  ) {
    return renderPairingStage(c, job);
  }

  if (job.status === "negotiating") return renderNegotiatingStage(c, job);
  if (job.status === "searching") return renderSearchingStage(c, job);
  if (job.status === "agreed") return renderAgreedStage(c, job);

  if (
    ["paid_booked", "en_route", "arrived", "in_progress"].includes(job.status)
  ) {
    return renderTrackingStage(c, job);
  }

  if (job.status === "completed") return renderCompletedStage(c, job);

  if (
    isPayoutPendingSettlement(job) &&
    job.status !== "released" &&
    viewer === "repair_pro"
  ) {
    return renderPendingSettlementStage(c, job);
  }

  if (job.status === "released" || job.status === "satisfied") {
    return renderReleasedStage(c, job);
  }

  if (job.status === "disputed" || job.status === "under_appeal") {
    return renderDisputedStage(c, job);
  }

  return renderCancelledStage(c, job);
}
