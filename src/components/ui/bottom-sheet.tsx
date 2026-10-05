"use client";

/**
 * Trade-lock lower panel (25% height).
 * Close via:
 * 1) Swipe down (Home-style dy threshold + fling)
 * 2) Click / tap outside the panel (scrim)
 * 3) Grabber pill click
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SPRING, SWIPE_DOWN_DY } from "./bottom-sheet/constants";
import { useOnaPhoneMount } from "./bottom-sheet/use-ona-phone-mount";
import { useSheetPointerWheelClose } from "./bottom-sheet/use-sheet-pointer-wheel-close";

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  titleId?: string;
  className?: string;
  /** Resting panel height as a percentage of the phone shell (default 25). */
  heightPercent?: number;
  /**
   * When set, the panel is content-driven: it starts at `heightPercent`
   * but grows with its content up to `growToPercent` instead of being
   * pinned to a fixed height. Omit for fixed-height behavior.
   */
  growToPercent?: number;
};

export function BottomSheet({
  open,
  onClose,
  children,
  titleId,
  className,
  heightPercent = 25,
  growToPercent,
}: BottomSheetProps) {
  const { theme } = useApp();
  const isLight = theme === "light";
  const autoId = useId();
  const labelledBy = titleId || `${autoId}-sheet`;

  const mount = useOnaPhoneMount();
  const [present, setPresent] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const gestureY = useRef<number | null>(null);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const finishClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    gestureY.current = null;
    const sheet = sheetRef.current;
    const h = sheet?.offsetHeight ?? 200;
    if (sheet) {
      sheet.style.transition = SPRING;
      sheet.style.transform = `translate3d(0, ${h + 32}px, 0)`;
    }
    if (scrimRef.current) {
      scrimRef.current.style.transition = "opacity 0.35s ease";
      scrimRef.current.style.opacity = "0";
    }
    window.setTimeout(() => {
      onCloseRef.current();
      setPresent(false);
      closingRef.current = false;
    }, 450);
  }, []);

  // open → present (do not re-enter finishClose when parent flips open off)
  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setPresent(true);
    } else if (!closingRef.current) {
      setPresent(false);
    }
  }, [open]);

  // Animate in after mount
  useLayoutEffect(() => {
    if (!present || !open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = "none";
    sheet.style.transform = "translate3d(0, 100%, 0)";
    if (scrimRef.current) {
      scrimRef.current.style.transition = "none";
      scrimRef.current.style.opacity = "0";
    }
    void sheet.offsetHeight;
    requestAnimationFrame(() => {
      sheet.style.transition = SPRING;
      sheet.style.transform = "translate3d(0, 0, 0)";
      if (scrimRef.current) {
        scrimRef.current.style.transition = "opacity 0.35s ease";
        scrimRef.current.style.opacity = "1";
      }
    });
  }, [present, open]);

  /**
   * SWIPE DOWN only (never swipe up).
   * Finger: clientY increases as finger moves down → dy > 0 → close.
   * Trackpad (natural scroll): fingers move down → deltaY < 0 → close.
   */
  const onTouchStart = (e: ReactTouchEvent) => {
    gestureY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    if (gestureY.current == null || closingRef.current) return;
    const dy = e.touches[0].clientY - gestureY.current;
    // Finger moved DOWN the screen
    if (dy > SWIPE_DOWN_DY) {
      gestureY.current = null;
      finishClose();
    }
    // dy < 0 = swipe up → ignore
  };

  const onTouchEnd = () => {
    gestureY.current = null;
  };

  useSheetPointerWheelClose(present, sheetRef, closingRef, finishClose);

  if (!present || !mount) return null;

  const sheetBg = isLight ? "#d4d5d9" : "#1c1c1e";

  return createPortal(
    <div
      className="absolute inset-0 z-[200] flex flex-col justify-end"
      role="presentation"
      data-no-theme-toggle
    >
      {/* Tap / click any space outside the panel → close */}
      <div
        ref={scrimRef}
        role="button"
        tabIndex={-1}
        aria-label="Close"
        className="absolute inset-0 border-0"
        style={{
          backgroundColor: isLight ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.55)",
          opacity: 0,
          cursor: "default",
        }}
        onClick={() => finishClose()}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
            finishClose();
          }
        }}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        data-no-theme-toggle
        className={cn(
          "relative z-[1] flex w-full flex-col overflow-hidden",
          "rounded-t-[14px] pb-[max(0.5rem,env(safe-area-inset-bottom))]",
          className,
        )}
        style={{
          height: growToPercent != null ? "auto" : `${heightPercent}%`,
          minHeight: `${heightPercent}%`,
          maxHeight:
            growToPercent != null ? `${growToPercent}%` : `${heightPercent}%`,
          backgroundColor: sheetBg,
          transform: "translate3d(0, 100%, 0)",
          willChange: "transform",
          touchAction: "pan-y",
          boxShadow: isLight
            ? "0 -8px 40px rgba(0,0,0,0.16)"
            : "0 -12px 48px rgba(0,0,0,0.5)",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber */}
        <div className="flex shrink-0 justify-center pb-1.5 pt-2.5">
          <button
            type="button"
            aria-label="Close"
            className="flex cursor-grab items-center justify-center border-0 bg-transparent px-8 py-1 active:cursor-grabbing"
            onClick={() => finishClose()}
          >
            <span
              className={cn(
                "block h-[5px] w-10 rounded-full",
                isLight ? "bg-black/25" : "bg-white/35",
              )}
            />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>,
    mount,
  );
}
