"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  blockedActionMessage,
  isChatClosedForNotification,
  isJobHistoryClosedStatus,
  isNavigationBlocked,
  isReleasePayPendingStatus,
  type AppNotification,
} from "@/lib/notifications/types";
import {
  CONVERSATION_ENDED_MESSAGE,
  messageThreadIdFromHref,
  readOnlyChatHref,
} from "@/lib/chat-expired";
import { apiGetJob } from "@/lib/jobs/client";

/** Tap handling for a center row: navigate, or show the blocked-action dialog. */
export function useNotificationAction({
  accountType,
  markRead,
  closeCenter,
}: {
  accountType: string | null | undefined;
  markRead: (ids: string[]) => Promise<void>;
  closeCenter: () => void;
}) {
  const router = useRouter();
  const [blockMsg, setBlockMsg] = useState<string | null>(null);
  const [viewHref, setViewHref] = useState<string | null>(null);

  const showBlock = (n: AppNotification, msg: string) => {
    setBlockMsg(msg || CONVERSATION_ENDED_MESSAGE);
    const tid = messageThreadIdFromHref(n.href);
    if (tid) {
      setViewHref(readOnlyChatHref(String(tid)));
      return;
    }
    const jid = n.jobId || null;
    if (jid) {
      setViewHref(`/jobs/${jid}`);
      return;
    }
    setViewHref(null);
  };

  const runAction = async (n: AppNotification) => {
    void markRead([n.id]);
    // Pro pairing request → dashboard + lower panel only
    if (
      accountType === "professional" &&
      (n.actionType === "accept_request" ||
        (n.category === "requests" &&
          (n.groupKey || "").startsWith("service-request")))
    ) {
      try {
        const { clearJobShown, requestForceIncomingPanel } =
          await import("@/lib/jobs/incoming-popup-timing");
        if (n.jobId) {
          clearJobShown(n.jobId);
          requestForceIncomingPanel(n.jobId);
        }
      } catch {
        /* */
      }
      closeCenter();
      router.replace("/dashboard");
      return;
    }
    if (!n.href) return;
    let liveStatus: string | undefined = n.jobStatus || undefined;
    if (n.jobId) {
      try {
        const res = await apiGetJob(n.jobId);
        if (res.ok && res.data.job?.status) {
          liveStatus = res.data.job.status;
        }
      } catch {
        /* use cached */
      }
    }
    if (isReleasePayPendingStatus(liveStatus || n.jobStatus)) {
      closeCenter();
      router.push(n.href.includes("/jobs/") ? n.href : `/jobs/${n.jobId}`);
      return;
    }
    if (isNavigationBlocked({ ...n, jobStatus: liveStatus })) {
      showBlock(n, blockedActionMessage(n, liveStatus));
      return;
    }
    if (
      isChatClosedForNotification(n) ||
      isJobHistoryClosedStatus(liveStatus)
    ) {
      showBlock(n, blockedActionMessage(n, liveStatus));
      return;
    }
    if (
      (n.href.includes("/jobs/") ||
        n.href.includes("/messages/") ||
        n.href.includes("/requests/")) &&
      (/demo/i.test(n.href) || (n.jobId && /demo/i.test(n.jobId)))
    ) {
      showBlock(n, blockedActionMessage(n, liveStatus));
      return;
    }
    closeCenter();
    router.push(n.href);
  };

  return { runAction, blockMsg, setBlockMsg, viewHref, setViewHref };
}
