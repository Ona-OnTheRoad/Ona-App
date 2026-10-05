"use client";

import { createElement } from "react";
import { isChatClosedForNotification } from "@/lib/notifications/types";
import type { ToastItem } from "@/components/notifications/notification-provider";
import { cn } from "@/lib/utils";
import { categoryIcon } from "../shared/category-icon";

export function ToastCard({
  t,
  depth,
  stacked,
  accent,
  onTap,
  onSwipeDismiss,
}: {
  t: ToastItem;
  depth: number;
  stacked: boolean;
  accent: string;
  onTap: () => void;
  onSwipeDismiss?: () => void;
}) {
  const n = t.notification;
  const closed = isChatClosedForNotification(n);
  const iconType = categoryIcon(n);
  const scale = stacked && depth > 0 ? 1 - depth * 0.03 : 1;
  const y = stacked && depth > 0 ? depth * 6 : 0;
  const opacity = stacked && depth > 0 ? 1 - depth * 0.12 : 1;
  const showActions = !stacked || depth === 0;

  return (
    <div
      className={cn(
        "pointer-events-auto w-full",
        stacked
          ? depth === 0
            ? "relative animate-[om-toast-in_0.32s_cubic-bezier(0.2,0.8,0.2,1)]"
            : "absolute left-0 right-0 top-0"
          : "relative animate-[om-toast-in_0.32s_cubic-bezier(0.2,0.8,0.2,1)]",
      )}
      style={{
        zIndex: stacked ? 40 - depth : 50,
        transform:
          stacked && depth > 0
            ? `translateY(${y}px) scale(${scale})`
            : undefined,
        opacity,
        pointerEvents: stacked && depth > 0 ? "none" : "auto",
      }}
      onTouchStart={
        showActions && onSwipeDismiss
          ? (e) => {
              const y0 = e.touches[0]?.clientY ?? 0;
              const el = e.currentTarget;
              const move = (ev: TouchEvent) => {
                const dy = (ev.touches[0]?.clientY ?? y0) - y0;
                if (dy < -28) {
                  onSwipeDismiss();
                  cleanup();
                }
              };
              const end = () => cleanup();
              const cleanup = () => {
                el.removeEventListener("touchmove", move);
                el.removeEventListener("touchend", end);
              };
              el.addEventListener("touchmove", move, { passive: true });
              el.addEventListener("touchend", end);
            }
          : undefined
      }
    >
      <button
        type="button"
        className="w-full border-0 p-0 text-left"
        style={{ background: "transparent" }}
        onClick={onTap}
      >
        <div
          className="flex h-16 w-full items-center gap-2.5 rounded-xl px-3"
          style={{
            backgroundColor: "#F0F2F5",
            boxShadow: "0 8px 24px rgba(15,20,27,0.14)",
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden
          >
            {createElement(iconType, {
              className: "h-5 w-5",
              style: { color: "#FFFFFF" },
              strokeWidth: 2,
            })}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-bold leading-tight tracking-[-0.01em] text-[#0F141B]">
                Ona
              </span>
              <span className="shrink-0 text-[11px] font-medium text-[#0F141B]/50">
                · now
              </span>
            </div>
            <p className="mt-0.5 truncate text-[13px] font-semibold leading-snug tracking-[-0.01em] text-[#0F141B]">
              {n.title}
            </p>
            <p className="mt-0.5 truncate text-[12px] font-normal leading-snug text-[#5B6572]">
              {closed && n.messageText ? n.messageText : n.body}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
