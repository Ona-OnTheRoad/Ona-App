"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children?: ReactNode;
}

const PULL_THRESHOLD = 52;
const MAX_PULL = 78;

function isMapOrControlTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "[data-map-surface], .gm-style, .leaflet-container, input, textarea, select, [role='slider']",
    ),
  );
}

function findScrollableParent(el: Element | null): HTMLElement | null {
  let curr = el;
  while (curr && curr.id !== "ona-phone" && curr !== document.body) {
    if (curr instanceof HTMLElement) {
      const style = window.getComputedStyle(curr);
      const overflowY = style.overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        curr.scrollHeight > curr.clientHeight
      ) {
        return curr;
      }
    }
    curr = curr.parentElement;
  }
  return null;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const trackingRef = useRef(false);
  const scrollableRef = useRef<HTMLElement | null>(null);
  const refreshingRef = useRef(false);
  refreshingRef.current = refreshing;

  useEffect(() => {
    const phone = document.getElementById("ona-phone");
    if (!phone) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (e.touches.length !== 1) return;
      const target = e.target as Element | null;
      if (isMapOrControlTarget(target)) return;

      const scroller = findScrollableParent(target);
      scrollableRef.current = scroller;

      // Only initiate pull-to-refresh if already at the top of scroll container
      if (scroller && scroller.scrollTop > 1) {
        trackingRef.current = false;
        return;
      }

      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      trackingRef.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!trackingRef.current || refreshingRef.current) return;
      if (e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startYRef.current;
      const deltaX = currentX - startXRef.current;

      // If scrolling up or swiping more horizontally than vertically, abort
      if (deltaY <= 0 || Math.abs(deltaX) > deltaY) {
        if (deltaY < 0) trackingRef.current = false;
        return;
      }

      const scroller = scrollableRef.current;
      if (scroller && scroller.scrollTop > 1) {
        trackingRef.current = false;
        setPullY(0);
        return;
      }

      // Smooth damped resistance pull
      const damped = Math.min(MAX_PULL, deltaY * 0.42);
      setPullY(damped);
    };

    const onTouchEnd = () => {
      if (!trackingRef.current) return;
      trackingRef.current = false;

      if (pullY >= PULL_THRESHOLD && !refreshingRef.current) {
        setRefreshing(true);
        setPullY(PULL_THRESHOLD);

        // Dispatch app-wide refresh notification
        window.dispatchEvent(new CustomEvent("ona:refresh"));
        router.refresh();
        window.location.reload();

        window.setTimeout(() => {
          setRefreshing(false);
          setPullY(0);
        }, 850);
      } else {
        setPullY(0);
      }
    };

    phone.addEventListener("touchstart", onTouchStart, { passive: true });
    phone.addEventListener("touchmove", onTouchMove, { passive: false });
    phone.addEventListener("touchend", onTouchEnd, { passive: true });
    phone.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      phone.removeEventListener("touchstart", onTouchStart);
      phone.removeEventListener("touchmove", onTouchMove);
      phone.removeEventListener("touchend", onTouchEnd);
      phone.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pullY, router]);

  const active = pullY > 6 || refreshing;
  const progress = Math.min(1, pullY / PULL_THRESHOLD);

  return (
    <>
      {active ? (
        <div
          role="status"
          aria-live="polite"
          aria-label={refreshing ? "Refreshing content" : "Pull to refresh"}
          className="pointer-events-none absolute left-1/2 top-3 z-[260] -translate-x-1/2 transition-transform duration-100 ease-out"
          style={{
            transform: `translate(-50%, ${pullY > 0 ? pullY * 0.75 : 0}px)`,
            opacity: progress > 0.2 ? Math.min(1, (progress - 0.2) / 0.6) : 0,
          }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/95 shadow-[0_6px_20px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/15 dark:bg-[#1c1c1e]/95">
            <RefreshCw
              className={cn(
                "h-4 w-4 text-ona-brand",
                refreshing && "animate-spin",
              )}
              style={{
                transform: refreshing
                  ? undefined
                  : `rotate(${Math.round(progress * 270)}deg)`,
                transition: refreshing ? undefined : "transform 0.08s ease-out",
              }}
            />
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
