"use client";

import { useEffect, useState } from "react";

/** Delay the verify panel until the page has fully loaded + painted */
export function useVerifyPanelReady(): boolean {
  const [verifyPanelReady, setVerifyPanelReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const show = () => {
      if (cancelled) return;
      // rAF after load → ensure the shell/list has painted first
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        setVerifyPanelReady(true);
      });
    };
    if (document.readyState === "complete") {
      show();
    } else {
      window.addEventListener("load", show, { once: true });
    }
    return () => {
      cancelled = true;
      window.removeEventListener("load", show);
    };
  }, []);
  return verifyPanelReady;
}
