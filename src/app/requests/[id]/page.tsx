"use client";

/**
 * Past request / job view-only full process.
 * Acceptance, trip, arrival, work, payment, chat (read-only), rating.
 * Flat stage layout: no extra panels, glow, or gradients.
 */

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import {
  CONVERSATION_ENDED_MESSAGE,
  readOnlyChatHref,
} from "@/lib/chat-expired";
import { useJobCallout } from "@/lib/callout/use-job-callout";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { RequestChatRatingSections } from "@/components/requests/request-chat-rating-sections";
import { RequestDealSections } from "@/components/requests/request-deal-sections";
import { historyAt } from "@/components/requests/request-detail-helpers";
import { RequestProgressSections } from "@/components/requests/request-progress-sections";
import { RequestSummarySection } from "@/components/requests/request-summary-section";
import { RequestTimelineSection } from "@/components/requests/request-timeline-section";
import { useRequestDetail } from "@/components/requests/use-request-detail";

export default function RequestProcessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { theme, accountType } = useApp();
  const isLight = theme === "light";
  const isPro = accountType === "professional";

  const { job, loading, err, chatThread } = useRequestDetail(id);
  const [expiredOpen, setExpiredOpen] = useState(false);

  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-700" : "text-white/75";
  const stage = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const hairline = isLight ? "border-black/10" : "border-white/10";
  const backHref = isPro ? "/jobs" : "/history";
  const { quote: calloutQuote } = useJobCallout(
    job?.id,
    job?.status,
    job?.calloutQuote,
  );

  if (loading) {
    return (
      <div className={cn("flex h-full flex-col", stage)}>
        <PageHeader title="Job details" backHref={backHref} />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#FF6B35]" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className={cn("flex h-full flex-col", stage)}>
        <PageHeader title="Job details" backHref={backHref} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className={cn("text-[15px] font-semibold", ink)}>
            {err || "Job not found"}
          </p>
          <button
            type="button"
            onClick={() => router.push(isPro ? "/jobs" : "/")}
            className="h-11 rounded-md border-0 bg-[#2c2c2e] px-5 text-[13px] font-semibold text-white"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const counterpart = isPro ? job.motoristName : job.repairProName;
  const skill = PRO_SERVICE_LABELS[job.serviceType] ?? job.serviceType;
  const history = [...(job.statusHistory || [])].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  const timeline =
    history.length > 0
      ? history
      : [
          {
            status: job.status,
            at: job.createdAt,
            by: undefined as string | undefined,
          },
        ];

  const acceptedAt =
    historyAt(job, "agreed") ||
    (job.agreedMajor != null ? job.updatedAt : null);
  const paidAt = job.paidAt || historyAt(job, "paid_booked");
  const enRouteAt = historyAt(job, "en_route");
  const arrivedAt = historyAt(job, "arrived");
  const workAt = historyAt(job, "in_progress");
  const completedAt = historyAt(job, "completed");
  const satisfiedAt =
    job.satisfiedAt || historyAt(job, ["satisfied", "released"]);
  const releasedAt = job.releasedAt || historyAt(job, "released");
  const cancelledAt = job.cancelledAt || historyAt(job, "cancelled");

  const offers = [...(job.offers || [])].sort(
    (a, b) => a.offerIndex - b.offerIndex,
  );

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", stage)}>
      <PageHeader title="Job details" backHref={backHref} />

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-8 scrollbar-hide">
        <RequestSummarySection
          job={job}
          counterpart={counterpart}
          skill={skill}
          calloutQuote={calloutQuote}
          isLight={isLight}
          ink={ink}
          muted={muted}
        />
        <RequestDealSections
          job={job}
          isPro={isPro}
          offers={offers}
          acceptedAt={acceptedAt}
          paidAt={paidAt}
          releasedAt={releasedAt}
          cancelledAt={cancelledAt}
          calloutQuote={calloutQuote}
          hairline={hairline}
          ink={ink}
          muted={muted}
        />
        <RequestProgressSections
          job={job}
          enRouteAt={enRouteAt}
          arrivedAt={arrivedAt}
          workAt={workAt}
          completedAt={completedAt}
          satisfiedAt={satisfiedAt}
          ink={ink}
          muted={muted}
        />
        <RequestChatRatingSections
          job={job}
          chatThread={chatThread}
          onOpenChat={() => setExpiredOpen(true)}
          isLight={isLight}
          ink={ink}
          muted={muted}
        />
        <RequestTimelineSection
          timeline={timeline}
          isPro={isPro}
          isLight={isLight}
          ink={ink}
          muted={muted}
        />
      </div>

      <ExpiredDialog
        open={expiredOpen}
        isLight={isLight}
        message={CONVERSATION_ENDED_MESSAGE}
        onClose={() => setExpiredOpen(false)}
        onView={
          chatThread
            ? () => {
                setExpiredOpen(false);
                router.push(readOnlyChatHref(chatThread.id));
              }
            : undefined
        }
      />
    </div>
  );
}
