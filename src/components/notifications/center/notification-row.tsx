"use client";

import { createElement } from "react";
import { cn } from "@/lib/utils";
import {
  isChatClosedForNotification,
  isJobHistoryClosedStatus,
  isNavigationBlocked,
  isReleasePayPendingStatus,
  type AppNotification,
} from "@/lib/notifications/types";
import { categoryIcon } from "../shared/category-icon";
import { formatNotificationDate } from "../shared/format-when";
import { actionSpec } from "./action-spec";

export function NotificationRow({
  n,
  accountType,
  hoverHoldId,
  onEnter,
  onLeave,
  markRead,
  runAction,
}: {
  n: AppNotification;
  accountType: string | null | undefined;
  hoverHoldId: string | null;
  onEnter: (n: AppNotification, unread: boolean) => void;
  onLeave: (n: AppNotification) => void;
  markRead: (ids: string[]) => Promise<void>;
  runAction: (n: AppNotification) => Promise<void>;
}) {
  const unread = !n.readAt;
  const closed = isChatClosedForNotification(n);
  const historyClosed = isJobHistoryClosedStatus(n.jobStatus);
  const releasePay = isReleasePayPendingStatus(n.jobStatus);
  const navBlocked =
    !releasePay && (isNavigationBlocked(n) || closed || historyClosed);
  const inert = closed || historyClosed;
  const Icon = categoryIcon(n);
  const isService = n.category === "requests";
  const spec = actionSpec(n, {
    navBlocked,
    accountType,
    releasePay,
  });
  const go = () => {
    markRead([n.id]);
    void runAction(n);
  };
  return (
    <li
      className="border-b border-ona-border last:border-b-0"
      onMouseEnter={() => onEnter(n, unread)}
      onMouseLeave={() => onLeave(n)}
    >
      <button
        type="button"
        disabled={inert}
        aria-disabled={inert}
        className={cn(
          "flex w-full items-center gap-3.5 border-0 bg-transparent px-4 py-3.5 text-left transition-colors",
          inert ? "cursor-default opacity-70" : "active:bg-ona-field hover:bg-ona-field/50 cursor-pointer",
        )}
        onClick={go}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            isService || unread
              ? "bg-[#FFF0EB] text-[#FF6B35] dark:bg-orange-950/40 dark:text-orange-400"
              : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300",
          )}
        >
          {createElement(Icon, {
            className: cn(
              "h-5 w-5",
              hoverHoldId === n.id && "animate-pulse",
            ),
            strokeWidth: 2,
            "aria-hidden": true,
          })}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-semibold leading-tight text-ona-ink">
              {n.title}
            </p>
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-normal text-ona-muted">
              {formatNotificationDate(n.createdAt)}
              {unread ? (
                <>
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-[#FF6B35]"
                  />
                  <span className="sr-only">Unread</span>
                </>
              ) : null}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-ona-muted">
            {closed && n.messageText ? n.messageText : n.body}
          </p>
          {closed && n.messageText ? (
            <p className="mt-0.5 text-[10px] font-semibold text-ona-muted">
              Job finished. Full message.
            </p>
          ) : null}
          {historyClosed && !closed && n.category === "requests" ? (
            <p className="mt-0.5 text-[10px] font-semibold text-ona-muted">
              Job {n.jobStatus?.replace(/_/g, " ") || "closed"}. Link
              unavailable.
            </p>
          ) : null}
        </div>
        {spec && spec.icon && spec.icon !== Icon ? (
          <span
            className="shrink-0 self-center pl-1 text-ona-muted"
            title={spec.label}
            aria-label={spec.label}
          >
            <spec.icon className="h-4 w-4" strokeWidth={2} />
          </span>
        ) : null}
      </button>
    </li>
  );
}
