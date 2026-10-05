import { useEffect } from "react";
import type { JobRecord } from "@/lib/jobs/types";
import type { JobViewer } from "./types";

/**
 * Live nearby count for customer while pairing only (hide on Retry/expired).
 * Can increase mid-wave if more pros go Live in radius.
 */
export function useNearbyLiveCount(
  job: JobRecord | null,
  viewer: JobViewer,
  setNearbyLiveCount: (v: number | null) => void,
) {
  useEffect(() => {
    const pairing =
      job &&
      viewer === "motorist" &&
      (job.status === "waiting_for_selected" ||
        job.status === "selected_review" ||
        job.status === "sequential_pairing" ||
        job.status === "waiting_for_pro" ||
        job.status === "reserved" ||
        job.status === "searching");
    if (!pairing || !job?.motoristLocation) {
      setNearbyLiveCount(null);
      return;
    }
    let cancelled = false;
    const lat = job.motoristLocation.lat;
    const lng = job.motoristLocation.lng;
    const radius =
      typeof job.radiusKm === "number" && job.radiusKm > 0 ? job.radiusKm : 10;
    const trade = job.serviceType;
    const tick = async () => {
      try {
        const { backendFetchPros } = await import("@/lib/supabase/app-api");
        const list = await backendFetchPros({ lat, lng });
        if (cancelled) return;
        const n = list.filter((t) => {
          if (t.serviceType !== trade) return false;
          const d =
            typeof t.distanceKm === "number" && Number.isFinite(t.distanceKm)
              ? t.distanceKm
              : Infinity;
          return d <= radius + 0.75;
        }).length;
        setNearbyLiveCount(n);
      } catch {
        /* keep last count */
      }
    };
    void tick();
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void tick();
    }, 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    job?.id,
    job?.status,
    job?.motoristLocation?.lat,
    job?.motoristLocation?.lng,
    job?.radiusKm,
    job?.serviceType,
    viewer,
    setNearbyLiveCount,
  ]);
}
