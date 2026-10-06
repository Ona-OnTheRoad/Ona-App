import { useEffect, useState } from "react";
import { getArtisanProfile } from "@/lib/artisan/local-store";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";

export function useDashboardArtisan({
  backendUserId,
  proLive,
  liveErr,
  setJobsCompletedCount,
}: {
  backendUserId: string | null | undefined;
  proLive: boolean;
  liveErr: string | null;
  setJobsCompletedCount: (n: number) => void;
}) {
  const [artisan, setArtisan] = useState<ArtisanVerificationProfile | null>(
    null,
  );

  useEffect(() => {
    if (!backendUserId) {
      setArtisan(null);
      setJobsCompletedCount(0);
      return;
    }
    try {
      setArtisan(getArtisanProfile(backendUserId));
    } catch {
      setArtisan(null);
    }
    // Jobs-completed count is derived from the shared loadJobs response below
    // never a second /api/jobs round trip on mount.
  }, [backendUserId, setJobsCompletedCount]);

  useEffect(() => {
    if (!backendUserId) {
      return;
    }

    let cancelled = false;
    const sync = async () => {
      try {
        const { syncArtisanCareStatus } =
          await import("@/lib/artisan/sync-care-status");
        const result = await syncArtisanCareStatus(backendUserId);
        if (!cancelled && result.ok && result.profile) {
          setArtisan(result.profile);
        }
      } catch {
        /* offline */
      }
    };
    // Care profile changes rarely, and the local copy below paints first
    // delay the refresh until just after first paint instead of racing the
    // boot /api/jobs loads.
    const first = window.setTimeout(() => void sync(), 800);
    // Data saver: care profile changes rarely 3 min backup
    const poll = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void sync();
    }, 180_000);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(poll);
    };
  }, [backendUserId, proLive, liveErr]);

  return artisan;
}
