"use client";

/**
 * App-wide toast for new chat messages (and optional call hint).
 * Renders inside the phone shell so alerts appear on any screen.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ensureNotifyPermission } from "@/lib/app-notify";
import { useApp } from "@/lib/store";
import { BannerView } from "./inbound-banner/banner-view";
import type { Banner } from "./inbound-banner/seen-anchors";
import { useInboundDetection } from "./inbound-banner/use-inbound-detection";

export function InboundBanner() {
  const {
    backendUserId,
    accountType,
    theme,
    refreshCloudChats,
    isAuthenticated,
  } = useApp();
  const isLight = theme === "light";
  const pathname = usePathname() || "";
  const router = useRouter();
  const [banner, setBanner] = useState<Banner>(null);
  const hideTimer = useRef<number | null>(null);

  // Initial chat pull so inbound detection has a baseline quickly
  useEffect(() => {
    if (!isAuthenticated || !backendUserId || !accountType) return;
    const first = window.setTimeout(() => refreshCloudChats(), 1_500);
    const onVis = () => {
      if (!document.hidden) refreshCloudChats();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(first);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isAuthenticated, backendUserId, accountType, refreshCloudChats]);

  // Ask notification permission after first user gesture (tap anywhere)
  useEffect(() => {
    if (!isAuthenticated) return;
    const once = () => {
      void ensureNotifyPermission();
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("keydown", once);
    };
    window.addEventListener("pointerdown", once, { passive: true });
    window.addEventListener("keydown", once);
    return () => {
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("keydown", once);
    };
  }, [isAuthenticated]);

  const showBanner = useCallback((b: NonNullable<Banner>) => {
    setBanner(b);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    // Top banners auto-hide after 3s
    hideTimer.current = window.setTimeout(() => setBanner(null), 3_000);
  }, []);

  useInboundDetection(pathname, showBanner);

  if (!banner) return null;

  return (
    <BannerView
      banner={banner}
      isLight={isLight}
      onOpen={() => {
        const href = banner.href;
        setBanner(null);
        router.push(href);
      }}
      onDismiss={() => setBanner(null)}
    />
  );
}
