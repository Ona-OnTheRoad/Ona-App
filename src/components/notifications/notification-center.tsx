"use client";

/**
 * NotificationCenter icon filters, flat X-style notification cards.
 * Every item renders with the same anatomy as the in-app toasts: category icon
 * chip (orange for high priority), "Ona · time" header, bold title, muted body,
 * action chip, unread dot. Read: solid grey action chips. Unread: orange.
 * Mark read on card click / hover no separate "Mark read" control.
 */

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MESSAGE_ORANGE } from "@/lib/notifications/types";
import { useNotifications } from "@/components/notifications/notification-provider";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import { CONVERSATION_ENDED_MESSAGE } from "@/lib/chat-expired";
import { useApp } from "@/lib/store";
import { FILTERS } from "./center/filters";
import { NotificationRow } from "./center/notification-row";
import { useHoldToRead } from "./center/use-hold-to-read";
import { useNotificationAction } from "./center/use-notification-action";

export function NotificationCenter() {
  const {
    centerOpen,
    closeCenter,
    filter,
    setFilter,
    search,
    setSearch,
    filtered,
    markRead,
    loading,
    unreadCount,
  } = useNotifications();
  const { theme, accountType } = useApp();
  const router = useRouter();
  const isLight = theme === "light";
  const { hoverHoldId, onEnter, onLeave } = useHoldToRead(markRead);
  const { runAction, blockMsg, setBlockMsg, viewHref, setViewHref } =
    useNotificationAction({ accountType, markRead, closeCenter });

  const accent = MESSAGE_ORANGE;
  const stage = isLight ? "#c8c9cd" : "#0a0a0a";
  const searchBg = isLight ? "#bebfc4" : "rgba(255,255,255,0.08)";
  const ink = isLight ? "#1a1b1e" : "#ffffff";
  const muted = isLight ? "#5c6370" : "rgba(255,255,255,0.65)";
  const line = isLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.12)";

  // Flatten: one X-style card per notification, newest first.
  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          (Date.parse(b.createdAt || "") || 0) -
          (Date.parse(a.createdAt || "") || 0),
      ),
    [filtered],
  );

  if (!centerOpen) return null;

  return (
    <div
      className="absolute inset-0 z-[95] flex flex-col"
      role="dialog"
      aria-modal
      aria-label="Notifications"
    >
      <button
        type="button"
        className="absolute inset-0 border-0"
        style={{ backgroundColor: isLight ? "#00000055" : "#00000099" }}
        aria-label="Close notifications"
        onClick={closeCenter}
      />
      <div
        className="relative z-10 mt-auto flex h-[92%] max-h-full w-full flex-col animate-[om-sheet-up_0.28s_ease-out] sm:ml-auto sm:mt-0 sm:h-full sm:max-w-[400px]"
        style={{ backgroundColor: stage }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-4">
          <div className="min-w-0">
            <h2
              className="text-[18px] font-bold tracking-tight"
              style={{ color: ink }}
            >
              Notifications
            </h2>
            <p
              className="mt-0.5 text-[11px] font-medium"
              style={{ color: muted }}
            >
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>

        <div className="shrink-0 px-4 pb-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications"
            className="h-10 w-full rounded-md border-0 px-3 text-[13px] font-medium outline-none"
            style={{ backgroundColor: searchBg, color: ink }}
          />
        </div>

        <div className="shrink-0 px-3 pb-2">
          <div className="grid w-full grid-cols-5 gap-0">
            {FILTERS.map((f) => {
              const on = filter === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  title={f.label}
                  aria-label={f.label}
                  aria-pressed={on}
                  onClick={() => setFilter(f.id)}
                  className="flex h-10 w-full items-center justify-center border-0 bg-transparent"
                  style={{ color: on ? accent : muted }}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    strokeWidth={on ? 2.4 : 2}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-8 scrollbar-hide">
          {loading && (
            <p
              className="px-4 py-12 text-center text-[13px] font-medium"
              style={{ color: muted }}
            >
              Loading…
            </p>
          )}
          {!loading && sorted.length === 0 && (
            <div className="px-4 py-20 text-center">
              <p className="text-[15px] font-semibold" style={{ color: ink }}>
                You’re all caught up
              </p>
              <p
                className="mx-auto mt-2 max-w-[240px] text-[12px] font-medium leading-relaxed"
                style={{ color: muted }}
              >
                Job updates, messages, and payments will appear here when
                something needs you.
              </p>
            </div>
          )}

          <ul className="list-none">
            {/* Hold-to-read timers: 1.5s deliberate hover marks read */}
            {sorted.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                isLight={isLight}
                accountType={accountType}
                accent={accent}
                ink={ink}
                muted={muted}
                line={line}
                hoverHoldId={hoverHoldId}
                onEnter={onEnter}
                onLeave={onLeave}
                markRead={markRead}
                runAction={runAction}
              />
            ))}
          </ul>
        </div>

        <ExpiredDialog
          open={Boolean(blockMsg)}
          isLight={isLight}
          message={blockMsg || CONVERSATION_ENDED_MESSAGE}
          onClose={() => {
            setBlockMsg(null);
            setViewHref(null);
          }}
          onView={
            viewHref
              ? () => {
                  const href = viewHref;
                  setBlockMsg(null);
                  setViewHref(null);
                  closeCenter();
                  router.push(href);
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
