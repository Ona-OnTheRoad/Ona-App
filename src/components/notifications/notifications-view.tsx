"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/notifications/notification-provider";
import { ArrowLeft, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import { CONVERSATION_ENDED_MESSAGE } from "@/lib/chat-expired";
import { useApp } from "@/lib/store";
import { FILTERS } from "./center/filters";
import { NotificationRow } from "./center/notification-row";
import { useHoldToRead } from "./center/use-hold-to-read";
import { useNotificationAction } from "./center/use-notification-action";

export function NotificationsView({
  onBack,
  standalone = false,
}: {
  onBack?: () => void;
  standalone?: boolean;
}) {
  const {
    filter,
    setFilter,
    search,
    setSearch,
    filtered,
    markRead,
    loading,
    unreadCount,
    markAllRead,
    closeCenter,
  } = useNotifications();
  const { theme, accountType } = useApp();
  const router = useRouter();
  const isLight = theme === "light";
  const { hoverHoldId, onEnter, onLeave } = useHoldToRead(markRead);
  const { runAction, blockMsg, setBlockMsg, viewHref, setViewHref } =
    useNotificationAction({
      accountType,
      markRead,
      closeCenter: onBack || closeCenter,
    });

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          (Date.parse(b.createdAt || "") || 0) -
          (Date.parse(a.createdAt || "") || 0),
      ),
    [filtered],
  );

  const showChrome =
    !loading && (sorted.length > 0 || filter !== "all" || search.trim() !== "");

  return (
    <div
      className={cn(
        "ona2 flex h-full min-h-0 w-full flex-col bg-ona-bg",
        standalone ? "overflow-y-auto pb-24" : "h-full",
      )}
    >
      <div className="shrink-0 px-5 pt-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-ona-ink cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-bold leading-tight tracking-tight text-ona-ink">
            Notifications
          </h2>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={unreadCount === 0}
            className="border-0 bg-transparent p-1 text-[11px] font-semibold text-ona-brand-ink underline disabled:no-underline disabled:opacity-50 cursor-pointer"
          >
            Mark all as read
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
      </div>

      {showChrome ? (
        <div className="shrink-0 space-y-3 px-5 pt-4">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ona-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications"
              aria-label="Search notifications"
              className="h-11 w-full rounded-ona-ctl border border-ona-border bg-ona-field pl-9 pr-3 text-[13px] font-medium text-ona-ink outline-none focus:border-ona-ink"
            />
          </div>
          <div
            role="group"
            aria-label="Filter notifications"
            className="flex gap-2 overflow-x-auto scrollbar-hide"
          >
            {FILTERS.map((f) => {
              const on = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "h-7 shrink-0 rounded-full border px-3 text-[11px] font-semibold cursor-pointer",
                    on
                      ? "border-ona-brand bg-ona-brand-soft text-ona-brand-ink"
                      : "border-ona-border bg-ona-surface text-ona-ink",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4 scrollbar-hide">
        {loading && (
          <p className="py-12 text-center text-[13px] font-medium text-ona-muted">
            Loading…
          </p>
        )}
        {!loading && sorted.length === 0 && (
          <div className="flex flex-col items-center rounded-ona-card border border-ona-border bg-ona-surface px-6 py-16 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ona-field text-ona-muted">
              <Bell aria-hidden className="h-9 w-9" strokeWidth={1.5} />
            </span>
            <p className="mt-5 text-[14px] font-semibold text-ona-ink">
              No notifications yet
            </p>
            <p className="mx-auto mt-2 max-w-[240px] text-[12px] leading-relaxed text-ona-muted">
              You’re all caught up! Check back later for updates or new alerts.
            </p>
          </div>
        )}

        {sorted.length > 0 ? (
          <ul className="list-none rounded-ona-card border border-ona-border bg-ona-surface">
            {sorted.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                accountType={accountType}
                hoverHoldId={hoverHoldId}
                onEnter={onEnter}
                onLeave={onLeave}
                markRead={markRead}
                runAction={runAction}
              />
            ))}
          </ul>
        ) : null}
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
                (onBack || closeCenter)();
                router.push(href);
              }
            : undefined
        }
      />
    </div>
  );
}
