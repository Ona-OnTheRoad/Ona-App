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
import { toastWhen } from "../shared/format-when";
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
  // A cancelled/closed job's notification is informational only
  // the request is dead, so the row is inert: no navigation, no
  // tap affordance (mirrors the pro popup card vanishing on cancel).
  const inert = closed || historyClosed;
  const Icon = categoryIcon(n);
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
          "flex w-full items-start gap-3 border-0 bg-transparent px-3 py-3 text-left",
          inert ? "cursor-default opacity-70" : "active:bg-ona-field",
        )}
        onClick={go}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            unread
              ? "bg-ona-brand-soft text-ona-brand-ink"
              : "bg-ona-field text-ona-muted",
          )}
        >
          {createElement(Icon, {
            className: cn(
              "h-[17px] w-[17px]",
              hoverHoldId === n.id && "animate-pulse",
            ),
            strokeWidth: 2,
            "aria-hidden": true,
          })}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold leading-tight text-ona-ink">
              {n.title}
            </p>
            <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-ona-muted">
              {toastWhen(n.createdAt)}
              {unread ? (
                <>
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-ona-brand"
                  />
                  <span className="sr-only">Unread</span>
                </>
              ) : null}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ona-muted">
            {closed && n.messageText ? n.messageText : n.body}
          </p>
          {closed && n.messageText ? (
            <p className="mt-1 text-[10px] font-semibold text-ona-muted">
              Job finished. Full message.
            </p>
          ) : null}
          {historyClosed && !closed && n.category === "requests" ? (
            <p className="mt-1 text-[10px] font-semibold text-ona-muted">
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
            <spec.icon className="h-[17px] w-[17px]" strokeWidth={2} />
          </span>
        ) : null}
      </button>
    </li>
  );
}
