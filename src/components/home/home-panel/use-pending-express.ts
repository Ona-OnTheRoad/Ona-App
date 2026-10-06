"use client";

import { useEffect, useState } from "react";

export type PendingExpress = {
  requestId: string;
  trade: string;
  lat: number;
  lng: number;
  locationLabel: string;
};

/**
 * Unpaid Ona Express booking ("Finish payment" resume card) plus the app-wide
 * one-open-request rule: block new trade flows while one is live.
 */
export function usePendingExpress({
  isProMode,
  category,
  setCategory,
}: {
  isProMode: boolean;
  category: string;
  setCategory: (c: "none") => void;
}) {
  const [pendingExpress, setPendingExpress] = useState<PendingExpress | null>(
    null,
  );
  const [hasOpenRequest, setHasOpenRequest] = useState(false);
  const [openNotice, setOpenNotice] = useState(false);
  useEffect(() => {
    if (isProMode) return;
    let cancelled = false;
    const loadPending = async () => {
      try {
        const res = await fetch("/api/requests/open-state");
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setHasOpenRequest(Boolean(json?.data?.hasOpen));
        setPendingExpress(json?.data?.expressPending ?? null);
      } catch {
        /* optional */
      }
    };
    void loadPending();
    return () => {
      cancelled = true;
    };
  }, [isProMode, category]);

  // App-wide one-open-request rule: block new trade flows while one is live.
  useEffect(() => {
    if (isProMode || !hasOpenRequest || category === "none") return;
    setCategory("none");
    setOpenNotice(true);
  }, [category, hasOpenRequest, isProMode]);

  return { pendingExpress, openNotice, setOpenNotice };
}
