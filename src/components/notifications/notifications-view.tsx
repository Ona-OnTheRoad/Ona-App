"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/notifications/notification-provider";
import { ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import { CONVERSATION_ENDED_MESSAGE } from "@/lib/chat-expired";
import { useApp } from "@/lib/store";
import { FILTERS } from "./center/filters";
import { NotificationRow } from "./center/notification-row";
import { useHoldToRead } from "./center/use-hold-to-read";
import { useNotificationAction } from "./center/use-notification-action";
import { NoNotificationsIllustration } from "./no-notifications-illustration";

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
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-ona-ink cursor-pointer hover:bg-ona-field/60 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-3">
          <h2 className="text-[20px] font-bold dark:font-semibold leading-tight tracking-tight text-ona-ink">
            Notifications
          </h2>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={unreadCount === 0}
            className={cn(
              "border-0 bg-transparent p-1 text-[13px] font-semibold dark:font-medium dark:underline dark:underline-offset-4 dark:decoration-1 transition-colors cursor-pointer disabled:cursor-default",
              unreadCount > 0
                ? "text-ona-brand-ink dark:text-ona-brand hover:opacity-85"
                : "text-ona-muted opacity-60 dark:opacity-70",
            )}
          >
            Mark all as read
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
      </div>

      {showChrome ? (
        <div className="shrink-0 space-y-3 dark:space-y-3.5 px-5 pt-4">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ona-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications"
              aria-label="Search notifications"
              className="h-10 dark:h-11 w-full rounded-full dark:rounded-ona-card border border-ona-border bg-ona-surface dark:bg-ona-field pl-10 pr-4 text-[13px] font-medium dark:font-normal text-ona-ink placeholder:text-ona-muted outline-none transition-colors focus:border-ona-ink dark:focus:border-ona-border"
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
                    "h-8 shrink-0 rounded-full border px-4 text-[12px] font-medium transition-colors cursor-pointer",
                    f.id === "system" && "dark:hidden",
                    on
                      ? "border-ona-brand dark:border-ona-brand-border bg-ona-brand-soft text-ona-brand-ink font-semibold"
                      : "border-ona-border bg-ona-surface text-ona-muted hover:text-ona-ink",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4 dark:pt-10 scrollbar-hide flex flex-col">
        {loading && (
          <p className="py-12 text-center text-[13px] font-medium text-ona-muted">
            Loading…
          </p>
        )}
        {!loading && sorted.length === 0 && (
          <div className="my-auto flex min-h-[380px] dark:min-h-105 flex-1 flex-col rounded-2xl border border-ona-border bg-ona-surface px-6 py-12 items-center justify-center text-center dark:rounded-ona-sheet dark:border-[#333E4F] dark:bg-ona-bg dark:p-2.5">
            <div className="flex flex-1 flex-col items-center justify-center text-center w-full dark:rounded-ona-card dark:border dark:border-[#18181B] dark:bg-ona-field dark:px-6 dark:py-12">
              <NoNotificationsIllustration className="mx-auto h-44 w-48 dark:h-40 dark:w-44" />
              <h3 className="mt-5 text-[16px] font-bold text-ona-ink">
                No notifications yet
              </h3>
              <p className="mx-auto mt-2 max-w-65 text-[13px] leading-relaxed text-ona-muted">
                You’re all caught up! Check back later for updates or new
                alerts.
              </p>
            </div>
          </div>
        )}

        {sorted.length > 0 ? (
          <ul className="list-none overflow-hidden rounded-2xl dark:rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent divide-y divide-ona-border dark:divide-y-0">
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
