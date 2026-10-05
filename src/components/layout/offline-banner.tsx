"use client";

import { useEffect, useRef, useState } from "react";
import { useNetworkStatus } from "@/lib/network/use-network-status";

const BACK_ONLINE_MS = 3000;

/**
 * Tells people when the device is offline, and confirms when it is back. Screen readers are
 * told through a polite live region. Nothing is rendered while the connection is fine.
 */
export function OfflineBanner() {
  const { online } = useNetworkStatus();
  const [backOnline, setBackOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setBackOnline(false);
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setBackOnline(true);
    const t = window.setTimeout(() => setBackOnline(false), BACK_ONLINE_MS);
    return () => window.clearTimeout(t);
  }, [online]);

  const message = !online
    ? "You're offline. Screens you've opened are still here, and Ona will reconnect on its own."
    : backOnline
      ? "Back online."
      : null;

  return (
    <div role="status" aria-live="polite" className="shrink-0">
      {message ? (
        <p
          className={
            "m-0 px-3 py-2 text-center text-[12px] font-semibold leading-snug text-white " +
            (online ? "bg-[#1f7a4d]" : "bg-[#1c1c1e]")
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
