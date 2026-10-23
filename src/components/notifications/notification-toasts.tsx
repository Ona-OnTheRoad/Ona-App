"use client";

/**
 * In-app toasts X-style layout:
 * 1) Stacked pile (top) general updates only
 * 2) Full banners under the pile chat, call, payment, request accept
 * (never deck-stacked; newest first by time)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MESSAGE_ORANGE,
  CONVERSATION_ENDED_MESSAGE,
  JOB_CLOSED_MESSAGE,
  blockedActionMessage,
  isChatClosedForNotification,
  isJobHistoryClosedStatus,
  isNavigationBlocked,
  isReleasePayPendingStatus,
  shouldToastNotification,
  type AppNotification,
} from "@/lib/notifications/types";
import { isNonStackNotification } from "@/lib/notifications/stack-rules";
import {
  clearJobShown,
  requestForceIncomingPanel,
} from "@/lib/jobs/incoming-popup-timing";
import { useNotificationsOptional } from "@/components/notifications/notification-provider";
import type { ToastItem } from "@/components/notifications/notification-provider";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import { messageThreadIdFromHref, readOnlyChatHref } from "@/lib/chat-expired";
import { useApp } from "@/lib/store";
import { ToastCard } from "./toasts/toast-card";

function toastCreatedMs(t: ToastItem): number {
  const raw = t.notification.createdAt;
  const n = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

export function NotificationToasts() {
  const ctx = useNotificationsOptional();
  const { theme, accountType } = useApp();
  const router = useRouter();
  const isLight = theme === "light";
  const [expiredOpen, setExpiredOpen] = useState(false);
  const [expiredMsg, setExpiredMsg] = useState(CONVERSATION_ENDED_MESSAGE);
  const [viewHref, setViewHref] = useState<string | null>(null);
  if (!ctx) return null;
  const { toasts, dismissToast, markRead, openCenter } = ctx;

  const visible = toasts.filter((t) => shouldToastNotification(t.notification));

  const accent = MESSAGE_ORANGE;

  const safePush = (n: AppNotification, tId: string) => {
    void markRead([n.id]);
    dismissToast(tId);

    // Pro service request → dashboard + lower panel only (never full /jobs page)
    if (
      accountType === "professional" &&
      (n.actionType === "accept_request" ||
        (n.category === "requests" &&
          (n.groupKey || "").startsWith("service-request")))
    ) {
      if (n.jobId) {
        clearJobShown(n.jobId);
        requestForceIncomingPanel(n.jobId);
      }
      router.replace("/dashboard");
      return;
    }

    if (
      isReleasePayPendingStatus(n.jobStatus) ||
      (n.category === "payments" &&
        n.actionType === "open_job" &&
        n.href?.includes("/jobs/"))
    ) {
      const href = n.href || (n.jobId ? `/jobs/${n.jobId}` : null);
      if (href) {
        router.push(href);
        return;
      }
    }

    if (
      isNavigationBlocked(n) ||
      isChatClosedForNotification(n) ||
      isJobHistoryClosedStatus(n.jobStatus)
    ) {
      const tid = messageThreadIdFromHref(n.href);
      const jid =
        n.jobId && !String(n.jobId).startsWith("demo-") ? n.jobId : null;
      if (tid && !String(tid).startsWith("demo-")) {
        setViewHref(readOnlyChatHref(tid));
      } else if (jid) {
        setViewHref(`/requests/${jid}`);
      } else {
        setViewHref(null);
      }
      setExpiredMsg(blockedActionMessage(n));
      setExpiredOpen(true);
      return;
    }
    if (n.href) {
      router.push(n.href);
    } else {
      router.push("/notifications");
    }
  };

  // Order: ALL stacked pile first, then full rows below (newest first each)
  const stackable = visible
    .filter((t) => !isNonStackNotification(t.notification))
    .sort((a, b) => toastCreatedMs(b) - toastCreatedMs(a))
    .slice(0, 4);
  const fullRows = visible
    .filter((t) => isNonStackNotification(t.notification))
    .sort((a, b) => toastCreatedMs(b) - toastCreatedMs(a));

  if (!stackable.length && !fullRows.length && !expiredOpen) return null;

  const cardProps = {
    accent,
    accountType,
  };

  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-2 z-[90] flex flex-col items-center px-4"
        aria-live="polite"
      >
        <div className="flex w-full max-w-[460px] flex-col gap-2">
          {/* 1) Stacked pile general only */}
          {stackable.length > 0 ? (
            <div className="relative w-full">
              {stackable.map((t, index) => (
                <ToastCard
                  key={t.id}
                  t={t}
                  depth={index}
                  stacked
                  {...cardProps}
                  onTap={() => safePush(t.notification, t.id)}
                  onSwipeDismiss={() => dismissToast(t.id)}
                />
              ))}
              {stackable.length > 1 ? (
                <div
                  aria-hidden
                  style={{ height: Math.min(stackable.length - 1, 3) * 6 }}
                />
              ) : null}
            </div>
          ) : null}

          {/* 2) Full banners under pile chat / call / payment / accept */}
          {fullRows.map((t) => (
            <ToastCard
              key={t.id}
              t={t}
              depth={0}
              stacked={false}
              {...cardProps}
              onTap={() => safePush(t.notification, t.id)}
              onSwipeDismiss={() => dismissToast(t.id)}
            />
          ))}
        </div>
      </div>
      <ExpiredDialog
        open={expiredOpen}
        isLight={isLight}
        message={expiredMsg || JOB_CLOSED_MESSAGE}
        onClose={() => {
          setExpiredOpen(false);
          setViewHref(null);
        }}
        onView={
          viewHref
            ? () => {
                const href = viewHref;
                setExpiredOpen(false);
                setViewHref(null);
                router.push(href);
              }
            : undefined
        }
      />
    </>
  );
}
