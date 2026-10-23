"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { DeletionBanner } from "@/components/profile/deletion-banner";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";
import { useOverlayGatesReady } from "@/lib/use-overlay-gates-ready";
import { usePhoneRect } from "@/components/layout/app-dock/use-phone-rect";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { isPublicPath } from "@/lib/routes";

/**
 * Overlays only mount after the page has loaded and settled (see useOverlayGatesReady), and most
 * apply to one role or state, so they are loaded on demand instead of being part of every page's
 * first-load JavaScript. This keeps the shared bundle small on slow connections (the onboarding
 * sheet alone pulls in the whole Repair Pro onboarding wizard and the Nigerian places data).
 */
const ProOnboardingSheet = dynamic(
  () =>
    import("@/components/pro/pro-onboarding-sheet").then(
      (m) => m.ProOnboardingSheet,
    ),
  { ssr: false },
);
const PostSwitchPhoneOtpGate = dynamic(
  () =>
    import("@/components/auth/post-switch-phone-otp-gate").then(
      (m) => m.PostSwitchPhoneOtpGate,
    ),
  { ssr: false },
);
const AcceptTripPopup = dynamic(
  () =>
    import("@/components/home/accept-trip-popup").then((m) => m.AcceptTripPopup),
  { ssr: false },
);
const IncomingJobPopup = dynamic(
  () =>
    import("@/components/home/incoming-job-popup").then(
      (m) => m.IncomingJobPopup,
    ),
  { ssr: false },
);
const MotoristReleasePayGate = dynamic(
  () =>
    import("@/components/jobs/motorist-release-pay-gate").then(
      (m) => m.MotoristReleasePayGate,
    ),
  { ssr: false },
);

/** Real controls / cards never toggle theme when these are the target. */
const CONTROL_SELECTOR = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "video",
  "[contenteditable='true']",
  "[contenteditable='']",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='switch']",
  "[role='checkbox']",
  "[role='slider']",
  "[role='textbox']",
  "[role='combobox']",
  "[data-no-theme-toggle]",
  ".card-surface",
  "[data-card]",
].join(", ");

/**
 * Free space = anything that is not a real control or card.
 * Map tiles, headers, padding, empty list areas are free (Motorist home included).
 */
function isBlockedTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Element)) return true;
  const node = el instanceof HTMLElement ? el : el.parentElement;
  if (!node) return true;

  if (node.closest(CONTROL_SELECTOR)) return true;

  const tag = node.tagName?.toLowerCase();
  if (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    tag === "option" ||
    tag === "button" ||
    tag === "a" ||
    tag === "label" ||
    tag === "video" ||
    node.isContentEditable
  ) {
    return true;
  }

  return false;
}

/**
 * Fixed phone app frame. Double-click / double-tap free space fully toggles light/dark.
 *
 * Capture-phase native listeners so Motorist pages work: Google Maps and many
 * child handlers stop bubble-phase events that React onTouchEnd never sees.
 */
export function PhoneShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { theme, toggleTheme, isAuthenticated } = useApp();
  const pathname = usePathname() || "";
  const isAuthOrPublic =
    !isAuthenticated ||
    isPublicPath(pathname) ||
    pathname === "/logout" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  /** Page paints first; overlays wait for auth + settle */
  const gatesReady = useOverlayGatesReady();
  const isLight = theme === "light";
  /** Publish --ona-phone-* CSS variables and keep them synced with screen size */
  usePhoneRect();
  /** Phone frame interior explicit colors avoid browser class lag */
  const phoneInterior = isLight ? "#c8c9cd" : "#000000";
  const lastTapRef = useRef(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const toggleThemeRef = useRef(toggleTheme);
  toggleThemeRef.current = toggleTheme;
  /** Suppress synthetic dblclick after touch double-tap (browser inconsistency) */
  const ignoreDblClickUntilRef = useRef(0);
  const togglingRef = useRef(false);

  useEffect(() => {
    // Listen on phone interior only theme chrome inside the frame
    const phone = document.getElementById("ona-phone");
    if (!phone) return;

    const runToggle = () => {
      // Coalesce rapid double fires (touch + mouse) so interior doesn't land wrong
      if (togglingRef.current) return;
      togglingRef.current = true;
      toggleThemeRef.current();
      window.setTimeout(() => {
        togglingRef.current = false;
      }, 350);
    };

    const onDblClick = (e: MouseEvent) => {
      if (Date.now() < ignoreDblClickUntilRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (isBlockedTarget(e.target)) return;
      // Only when click is inside phone frame
      if (!phone.contains(e.target as Node)) return;
      const sel = window.getSelection()?.toString();
      if (sel && sel.length > 0) {
        window.getSelection()?.removeAllRanges();
      }
      e.preventDefault();
      e.stopPropagation();
      runToggle();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isBlockedTarget(e.target)) {
        lastTapRef.current = 0;
        lastPointRef.current = null;
        return;
      }
      if (!phone.contains(e.target as Node)) return;
      // Multi-touch / pinch → ignore
      if (e.touches.length > 0 || e.changedTouches.length !== 1) {
        lastTapRef.current = 0;
        lastPointRef.current = null;
        return;
      }

      const t = e.changedTouches[0];
      const now = Date.now();
      const prev = lastTapRef.current;
      const prevPt = lastPointRef.current;
      const gap = now - prev;

      // Same spot double-tap (allow small finger drift)
      const near =
        prevPt != null &&
        Math.hypot(t.clientX - prevPt.x, t.clientY - prevPt.y) < 40;

      if (gap < 400 && gap > 25 && near) {
        lastTapRef.current = 0;
        lastPointRef.current = null;
        // Block the synthetic dblclick some browsers fire after double-tap
        ignoreDblClickUntilRef.current = now + 500;
        e.preventDefault();
        e.stopPropagation();
        runToggle();
        return;
      }

      lastTapRef.current = now;
      lastPointRef.current = { x: t.clientX, y: t.clientY };
    };

    // Capture + non-passive so map taps reach us and preventDefault works
    const opts: AddEventListenerOptions = { capture: true, passive: false };
    phone.addEventListener("dblclick", onDblClick, opts);
    phone.addEventListener("touchend", onTouchEnd, opts);
    return () => {
      phone.removeEventListener("dblclick", onDblClick, opts);
      phone.removeEventListener("touchend", onTouchEnd, opts);
    };
  }, []);

  // Keep phone data-theme + paint in lockstep with React theme
  useEffect(() => {
    const phone = document.getElementById("ona-phone");
    if (!phone) return;
    phone.dataset.theme = theme;
    phone.style.backgroundColor = phoneInterior;
    // Inner content root inherits solid fill so pages don't flash wrong stage
    const inner = phone.firstElementChild as HTMLElement | null;
    if (inner) {
      inner.style.backgroundColor = phoneInterior;
    }
  }, [theme, phoneInterior]);

  return (
    <div
      id="ona-stage"
      className={cn(
        "box-border flex w-full items-center justify-center overflow-hidden",
        "min-h-[100dvh] h-[100dvh]",
        "p-0 sm:p-4 md:p-5",
        isLight
          ? "bg-[#c8c9cd] sm:bg-[#060d0a]"
          : "bg-black sm:bg-[#0a0605]",
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[2000] focus:rounded-md focus:bg-black focus:px-4 focus:py-3 focus:text-[14px] focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>
      <div
        id="ona-phone"
        data-theme={theme}
        className={cn(
          "relative box-border flex flex-col overflow-hidden",
          "w-full h-full min-h-[100dvh] h-[100dvh]",
          "sm:w-[420px] sm:max-w-[calc(100vw-2.5rem)]",
          "sm:min-h-0 sm:h-[min(884px,calc(100dvh-2.5rem))] sm:max-h-[min(884px,calc(100dvh-2.5rem))]",
          "sm:rounded-[36px] sm:shadow-[0_24px_50px_rgba(0,0,0,0.55)] sm:ring-1 sm:ring-white/10",
          className,
        )}
        style={{
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
          backgroundColor: phoneInterior,
        }}
      >
        <main
          id="main-content"
          tabIndex={-1}
          className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden outline-none"
          style={{ backgroundColor: phoneInterior }}
        >
          <OfflineBanner />
          <DeletionBanner />
          <PullToRefresh />
          {children}
          {gatesReady && !isAuthOrPublic ? (
            <>
              <ProOnboardingSheet />
              <PostSwitchPhoneOtpGate />
              <AcceptTripPopup />
              <IncomingJobPopup />
              <MotoristReleasePayGate />
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
