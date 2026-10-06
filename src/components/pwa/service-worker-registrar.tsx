"use client";

import { useEffect } from "react";

const DISABLE_KEY = "ona-sw-disabled";

function swDisabled(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has("no-sw")) return true;
    return window.localStorage.getItem(DISABLE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Remove the worker and its caches (kill switch for a bad release or a stuck device). */
async function removeServiceWorker() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("ona-")).map((n) => caches.delete(n)),
      );
    }
  } catch {
    /* nothing to clean up */
  }
}

function whenIdle(fn: () => void) {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
  };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 4000 });
  else window.setTimeout(fn, 1500);
}

/**
 * Registers /sw.js (offline pages, cached images and build files) in production, after the page
 * has loaded and the browser is idle, so it never competes with the first load on a slow connection.
 * Renders nothing.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    if (swDisabled()) {
      void removeServiceWorker();
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is an enhancement; the app works without it */
      });
    };
    if (document.readyState === "complete") whenIdle(register);
    else {
      const onLoad = () => whenIdle(register);
      window.addEventListener("load", onLoad, { once: true });
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  return null;
}
