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
  accountType?: string | null | undefined;
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
      className="border-b border-ona-border last:border-b-0 dark:mx-4 dark:border-[#18181B]"
      onMouseEnter={() => onEnter(n, unread)}
      onMouseLeave={() => onLeave(n)}
    >
      <button
        type="button"
        disabled={inert}
        aria-disabled={inert}
        className={cn(
          "flex w-full items-center dark:items-start gap-3.5 border-0 bg-transparent px-4 py-3.5 dark:px-0 dark:py-4 text-left transition-colors",
          inert
            ? "cursor-default opacity-70 dark:opacity-100"
            : "active:bg-ona-field hover:bg-ona-field/50 dark:active:bg-ona-field/40 dark:hover:bg-ona-field/30 cursor-pointer",
        )}
        onClick={go}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors dark:mt-0.5",
            isService || unread
              ? "bg-[#FFF0EB] text-[#FF6B35]"
              : "bg-gray-100 text-gray-600",
            isService
              ? "dark:bg-ona-brand-soft dark:text-ona-brand"
              : "dark:bg-ona-field-strong dark:text-ona-muted",
          )}
        >
          {createElement(Icon, {
            className: cn(
              "h-5 w-5",
              hoverHoldId === n.id && "animate-pulse",
            ),
            strokeWidth: 1.8,
            "aria-hidden": true,
          })}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] dark:text-[14px] font-semibold dark:font-medium leading-tight text-ona-ink">
              {n.title}
            </p>
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] dark:text-[12px] font-normal text-ona-muted">
              {formatNotificationDate(n.createdAt)}
              {unread ? (
                <>
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-[#FF6B35] dark:bg-ona-brand"
                  />
                  <span className="sr-only">Unread</span>
                </>
              ) : null}
            </span>
          </div>
          <p className="mt-0.5 dark:mt-1 line-clamp-1 dark:line-clamp-2 text-[12px] leading-snug text-ona-muted">
            {closed && n.messageText ? n.messageText : n.body}
          </p>
          {closed && n.messageText ? (
            <p className="mt-0.5 text-[10px] font-semibold text-ona-muted dark:hidden">
              Job finished. Full message.
            </p>
          ) : null}
          {historyClosed && !closed && n.category === "requests" ? (
            <p className="mt-0.5 text-[10px] font-semibold text-ona-muted dark:hidden">
              Job {n.jobStatus?.replace(/_/g, " ") || "closed"}. Link
              unavailable.
            </p>
          ) : null}
        </div>
        {spec && spec.icon && spec.icon !== Icon ? (
          <span
            className="shrink-0 self-center pl-1 text-ona-muted dark:hidden"
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
