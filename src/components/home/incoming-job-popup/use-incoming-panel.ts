import { useEffect, useRef, useState } from "react";
import type {
  Dispatch,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from "react";
import { setIncomingPanelOpen } from "@/lib/jobs/incoming-popup-timing";
import { COLLAPSE_SNAP_PX, PEEK_RATIO } from "./constants";
import type { PanelLevel } from "./types";

interface UseIncomingPanelParams {
  level: PanelLevel;
  setLevel: Dispatch<SetStateAction<PanelLevel>>;
  panelOpen: boolean;
}

/** Three-level lower panel behaviour: drag / wheel gestures, scroll reset on
 * level change, Escape swallow, and publishing panel visibility. */
export function useIncomingPanel({
  level,
  setLevel,
  panelOpen,
}: UseIncomingPanelParams) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ y: number; level: PanelLevel } | null>(null);
  const panelHeightRef = useRef(0);
  const panelScrollRef = useRef<HTMLDivElement | null>(null);
  const stepDown = () =>
    setLevel((l) =>
      l === "full" ? "middle" : l === "middle" ? "collapsed" : l,
    );

  // Trackpad swipe support, mirroring the customer Home lower panel
  // (bottom-sheet.tsx): a NATIVE non-passive wheel listener (React onWheel is
  // passive, so it cannot preventDefault the browser's own scroll). deltaY < 0
  // is the "swipe down" gesture → step down; deltaY > 0 is "swipe up" → step
  // up. At FULL the card list scrolls; a short cooldown swallows the leftover
  // momentum of the expand gesture so the freshly-expanded content stays at
  // the top (profile picture placeholder first) until the user scrolls.
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const levelRef = useRef<PanelLevel>("middle");
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    if (!panelOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    let accum = 0;
    let dir = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let swallowUntil = 0;

    const onWheel = (e: WheelEvent) => {
      const inScrollArea =
        e.target instanceof Element && e.target.closest("[data-panel-scroll]");
      // Leftover expand-momentum over the content must not scroll it the
      // profile picture stays first until the user deliberately scrolls.
      if (performance.now() < swallowUntil && inScrollArea) {
        e.preventDefault();
        return;
      }
      // Only at FULL does the card list scroll; elsewhere a swipe moves panel.
      if (levelRef.current === "full" && inScrollArea) return;
      const d = e.deltaY < 0 ? -1 : e.deltaY > 0 ? 1 : 0;
      if (d === 0) return;
      if (timer) clearTimeout(timer);
      if (d !== dir) {
        accum = 0;
        dir = d;
      }
      accum += Math.abs(e.deltaY);
      timer = setTimeout(() => {
        accum = 0;
      }, 180);
      if (accum > 24 || Math.abs(e.deltaY) > 18) {
        accum = 0;
        const l = levelRef.current;
        if (d === -1 && l !== "collapsed") {
          e.preventDefault();
          setLevel(l === "full" ? "middle" : "collapsed");
        } else if (d === 1 && l !== "full") {
          e.preventDefault();
          if (l === "collapsed") setLevel("middle");
          else {
            setLevel("full");
            swallowUntil = performance.now() + 400;
          }
        }
      }
    };

    const opts: AddEventListenerOptions = { passive: false };
    el.addEventListener("wheel", onWheel, opts);
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (timer) clearTimeout(timer);
    };
  }, [panelOpen, setLevel]);

  const peekHeight = Math.max(
    36,
    Math.round((panelHeightRef.current || 0) * PEEK_RATIO),
  );

  const isPanelControl = (el: EventTarget | null) =>
    Boolean(
      el instanceof Element &&
      el.closest("button, a, input, textarea, select, label, [role='slider']"),
    );

  const onPanelPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isPanelControl(e.target)) return;
    // At FULL the card list scrolls instead of dragging the panel; anywhere
    // else (and at middle/collapsed) any touch starts a panel drag.
    if (
      level === "full" &&
      e.target instanceof Element &&
      e.target.closest("[data-panel-scroll]")
    ) {
      return;
    }
    dragStartRef.current = { y: e.clientY, level };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPanelPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    const dy = e.clientY - start.y;
    if (start.level === "collapsed") setDragY(Math.min(0, dy));
    else if (start.level === "full") setDragY(Math.max(0, dy));
    else setDragY(dy);
  };

  const onPanelPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    dragStartRef.current = null;
    setDragging(false);
    const dy = e.clientY - start.y;
    if (start.level === "collapsed") {
      if (dy < -COLLAPSE_SNAP_PX) setLevel("middle");
    } else if (start.level === "middle") {
      if (dy < -COLLAPSE_SNAP_PX) setLevel("full");
      else if (dy > COLLAPSE_SNAP_PX) setLevel("collapsed");
    } else if (dy > COLLAPSE_SNAP_PX) {
      setLevel("middle");
    }
    setDragY(0);
  };

  // Must respond via buttons or wait for timer no outside tap / Escape dismiss
  // Hook is called unconditionally (before the accountType early return) so the
  // hook count never changes on a role switch (React error #310).
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [panelOpen]);

  // Every level change resets the card list to the top, so the profile
  // picture placeholder is the first thing visible at full expansion and
  // stays put until the user scrolls.
  useEffect(() => {
    if (panelScrollRef.current) panelScrollRef.current.scrollTop = 0;
  }, [level]);

  // Publish panel visibility so the dashboard can hide its "Incoming
  // requests" list while the lower panel is up.
  useEffect(() => {
    setIncomingPanelOpen(panelOpen);
    return () => setIncomingPanelOpen(false);
  }, [panelOpen]);

  return {
    dragY,
    dragging,
    dialogRef,
    panelHeightRef,
    panelScrollRef,
    peekHeight,
    stepDown,
    onPanelPointerDown,
    onPanelPointerMove,
    onPanelPointerEnd,
  };
}

export type IncomingPanelGesture = ReturnType<typeof useIncomingPanel>;
