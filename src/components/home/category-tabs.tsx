"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import { TradeTileGrid } from "@/components/home/trade-tile-grid";
import { TRADE_TILES } from "@/components/home/trade-tiles";
import { clearTradeFlowSession } from "@/lib/flow-sessions";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { ServiceCategory } from "@/lib/types";

/** Stop sheet gestures (swipe / wheel) from firing while the user types. */
const stopGesture = {
  onPointerDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onPointerUp: (e: React.SyntheticEvent) => e.stopPropagation(),
  onTouchStart: (e: React.SyntheticEvent) => e.stopPropagation(),
  onTouchEnd: (e: React.SyntheticEvent) => e.stopPropagation(),
  onWheel: (e: React.SyntheticEvent) => e.stopPropagation(),
};

/**
 * Trade picker: title + local search + 3-column tile grid (grid only while the
 * sheet is expanded). Swipe left → help page.
 */
export function CategoryTabs({
  expanded,
  onExpand,
  onCollapse,
  onSwipeLeft,
  onSwipeRight,
  onOpenHelp,
  compact,
}: {
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onOpenHelp?: () => void;
  /** Mechanic flow: shrink the trade grid so the card can fill the panel. */
  compact?: boolean;
}) {
  const { category, setCategory } = useApp();
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  // A trade is open → one compact chip row so the flow keeps the room.
  const isCompact = Boolean(compact) || category !== "none";
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const q = query.trim().toLowerCase();
  const tabs = q
    ? TRADE_TILES.filter((tile) => t(tile.labelKey).toLowerCase().includes(q))
    : TRADE_TILES;

  const onAxisWheel = (e: React.WheelEvent) => {
    if (!onExpand || !onCollapse) return;
    if (e.deltaY > 0 && !expanded) {
      e.preventDefault();
      e.stopPropagation();
      onExpand();
      return;
    }
    if (e.deltaY < 0 && expanded) {
      e.preventDefault();
      e.stopPropagation();
      onCollapse();
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) moved.current = true;
  };

  const finishGesture = (clientX: number, clientY: number) => {
    if (!start.current) return;
    const dx = clientX - start.current.x;
    const dy = clientY - start.current.y;
    start.current = null;

    // Horizontal swipe (lower threshold so it fires on mobile)
    if (!isCompact && Math.abs(dx) >= 28 && Math.abs(dx) > Math.abs(dy) * 0.9) {
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
      return;
    }

    if (!onExpand || !onCollapse) return;
    if (!expanded && dy < -18) onExpand();
    else if (expanded && dy > 18) onCollapse();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    finishGesture(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    start.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    moved.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!start.current) return;
    const dx = e.touches[0].clientX - start.current.x;
    const dy = e.touches[0].clientY - start.current.y;
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) moved.current = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    if (!t) {
      start.current = null;
      return;
    }
    finishGesture(t.clientX, t.clientY);
  };

  const onPick = (id: ServiceCategory) => {
    // Ignore click if this was a swipe
    if (moved.current) return;
    // Former "All" → ONA Shop (repair commerce)
    if (id === "all") {
      router.push("/shop");
      return;
    }
    // Re-tap the active trade → unclick (reset) it
    if (id === category) {
      clearTradeFlowSession(id);
      setCategory("none");
      return;
    }
    setQuery("");
    setCategory(id);
    onExpand?.();
  };

  const helpButton = onOpenHelp ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenHelp();
      }}
      aria-label={t("home.helpSomeone")}
      title={t("home.helpSomeone")}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-ona-muted"
    >
      <UserPlus className="h-5 w-5" strokeWidth={1.9} />
    </button>
  ) : null;

  return (
    <div
      className="relative px-4 pb-3 pt-1"
      onWheel={onAxisWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      {isCompact ? (
        <div className="flex items-center gap-1">
          <TradeTileGrid
            tiles={TRADE_TILES}
            active={category}
            compact
            onPick={onPick}
          />
          {helpButton}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="py-2 text-[17px] font-bold leading-tight text-ona-ink">
              Find trusted help near you.
            </p>
            {helpButton}
          </div>
          <div className="relative mb-3" {...stopGesture}>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ona-muted"
              strokeWidth={2}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => onExpand?.()}
              placeholder="What do you need help with?"
              aria-label="What do you need help with?"
              autoComplete="off"
              enterKeyHint="search"
              className="h-11 w-full rounded-ona-ctl border border-ona-border bg-ona-field pl-9 pr-3 text-[14px] text-ona-ink"
            />
          </div>
          {expanded ? (
            tabs.length > 0 ? (
              <TradeTileGrid
                tiles={tabs}
                active={category}
                compact={false}
                onPick={onPick}
              />
            ) : (
              <p
                role="status"
                className="py-6 text-center text-[13px] text-ona-muted"
              >
                No match
              </p>
            )
          ) : null}
        </>
      )}
    </div>
  );
}
