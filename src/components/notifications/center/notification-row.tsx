"use client";

import { createElement } from "react";
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
  isLight,
  accountType,
  accent,
  ink,
  muted,
  line,
  hoverHoldId,
  onEnter,
  onLeave,
  markRead,
  runAction,
}: {
  n: AppNotification;
  isLight: boolean;
  accountType: string | null | undefined;
  accent: string;
  ink: string;
  muted: string;
  line: string;
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
      style={{ borderBottom: `1px solid ${line}` }}
      onMouseEnter={() => onEnter(n, unread)}
      onMouseLeave={() => onLeave(n)}
    >
      <button
        type="button"
        disabled={inert}
        aria-disabled={inert}
        className={`flex w-full items-start gap-3.5 px-4 py-4 text-left ${
          inert
            ? "cursor-default opacity-70"
            : isLight
              ? "active:bg-black/[0.06]"
              : "active:bg-white/[0.08]"
        }`}
        style={{ backgroundColor: "transparent" }}
        onClick={go}
      >
        {createElement(Icon, {
          className: `mt-1 h-[18px] w-[18px] shrink-0${
            hoverHoldId === n.id ? " animate-pulse" : ""
          }`,
          style: {
            color: unread ? accent : muted,
            strokeWidth: unread ? 2.4 : 2,
          },
          "aria-hidden": true,
        })}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="truncate text-[13px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: ink }}
            >
              Ona
            </span>
            <span
              className="shrink-0 text-[11px] font-medium"
              style={{ color: muted }}
            >
              · {toastWhen(n.createdAt)}
            </span>
          </div>
          <p
            className="mt-1 text-[13px] font-semibold leading-snug tracking-[-0.01em]"
            style={{ color: ink }}
          >
            {n.title}
          </p>
          <p
            className="mt-1.5 line-clamp-2 text-[12px] font-normal leading-snug"
            style={{ color: muted }}
          >
            {closed && n.messageText ? n.messageText : n.body}
          </p>
          {closed && n.messageText ? (
            <p
              className="mt-1 text-[10px] font-semibold"
              style={{ color: muted }}
            >
              Job finished. Full message.
            </p>
          ) : null}
          {historyClosed && !closed && n.category === "requests" ? (
            <p
              className="mt-1 text-[10px] font-semibold"
              style={{ color: muted }}
            >
              Job {n.jobStatus?.replace(/_/g, " ") || "closed"}. Link
              unavailable.
            </p>
          ) : null}
        </div>
        {spec && spec.icon && spec.icon !== Icon ? (
          <span
            className="self-center shrink-0 pl-2"
            title={spec.label}
            aria-label={spec.label}
            style={{ color: unread ? accent : muted }}
          >
            <spec.icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
        ) : null}
      </button>
    </li>
  );
}
