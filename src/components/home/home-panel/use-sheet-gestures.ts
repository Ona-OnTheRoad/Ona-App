"use client";

import { useRef } from "react";

/** Wheel / pill-drag / pill-click handlers that expand or collapse the sheet. */
export function useSheetGestures({
  expanded,
  onExpand,
  onCollapse,
}: {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}) {
  const gestureY = useRef<number | null>(null);

  const onSheetWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && !expanded) {
      e.preventDefault();
      onExpand();
      return;
    }
    if (e.deltaY < 0 && expanded) {
      e.preventDefault();
      onCollapse();
    }
  };

  const onPillTouchStart = (e: React.TouchEvent) => {
    gestureY.current = e.touches[0].clientY;
  };

  const onPillTouchMove = (e: React.TouchEvent) => {
    if (gestureY.current == null) return;
    const dy = e.touches[0].clientY - gestureY.current;
    if (!expanded && dy < -14) {
      onExpand();
      gestureY.current = null;
      return;
    }
    if (expanded && dy > 14) {
      onCollapse();
      gestureY.current = null;
    }
  };

  const onPillClick = () => {
    if (expanded) onCollapse();
    else onExpand();
  };

  return {
    onSheetWheel,
    onPillTouchStart,
    onPillTouchMove,
    onPillClick,
  };
}
