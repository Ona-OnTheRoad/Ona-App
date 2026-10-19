"use client";

import { useEffect, type MutableRefObject, type RefObject } from "react";
import { SWIPE_DOWN_DY } from "./constants";
import { shouldIgnoreSheetGesture } from "./gesture-guard";

/** Pointer + trackpad: swipe DOWN only closes the sheet. */
export function useSheetPointerWheelClose(
  present: boolean,
  sheetRef: RefObject<HTMLDivElement | null>,
  closingRef: MutableRefObject<boolean>,
  finishClose: () => void,
) {
  useEffect(() => {
    if (!present) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    let startY: number | null = null;
    let downAccum = 0;
    let wheelReset: ReturnType<typeof setTimeout> | null = null;

    const onDown = (e: PointerEvent) => {
      if (closingRef.current) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const t = e.target as Element | null;
      if (t?.closest("a[href]")) return;
      if (shouldIgnoreSheetGesture(t, sheet)) return;
      startY = e.clientY;
    };

    const onMove = (e: PointerEvent) => {
      if (startY == null || closingRef.current) return;
      const dy = e.clientY - startY;
      // Pointer moved DOWN
      if (dy > SWIPE_DOWN_DY) {
        startY = null;
        finishClose();
      }
      // dy < 0 = up → ignore
    };

    const onUp = () => {
      startY = null;
    };

    /**
     * Trackpad two-finger SWIPE DOWN (natural scrolling):
     * fingers move down → content would scroll up → deltaY is negative.
     * We intentionally ignore deltaY > 0 (that is swipe UP).
     */
    const onWheel = (e: WheelEvent) => {
      if (closingRef.current) return;
      if (shouldIgnoreSheetGesture(e.target, sheet)) {
        downAccum = 0;
        return;
      }
      if (e.deltaY < 0) {
        // Swipe / roll DOWN
        downAccum += -e.deltaY;
        if (wheelReset) clearTimeout(wheelReset);
        wheelReset = setTimeout(() => {
          downAccum = 0;
        }, 180);
        if (downAccum > 24 || e.deltaY < -18) {
          downAccum = 0;
          e.preventDefault();
          finishClose();
        }
      } else {
        // Swipe up do nothing
        downAccum = 0;
      }
    };

    const opts: AddEventListenerOptions = { passive: false };
    sheet.addEventListener("pointerdown", onDown);
    sheet.addEventListener("pointermove", onMove);
    sheet.addEventListener("pointerup", onUp);
    sheet.addEventListener("pointercancel", onUp);
    sheet.addEventListener("wheel", onWheel, opts);
    return () => {
      sheet.removeEventListener("pointerdown", onDown);
      sheet.removeEventListener("pointermove", onMove);
      sheet.removeEventListener("pointerup", onUp);
      sheet.removeEventListener("pointercancel", onUp);
      sheet.removeEventListener("wheel", onWheel);
      if (wheelReset) clearTimeout(wheelReset);
    };
  }, [present, finishClose, sheetRef, closingRef]);
}
