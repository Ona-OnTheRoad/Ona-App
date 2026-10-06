import { useEffect } from "react";
import { apiPushTripLocation, getCurrentPosition } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import type { JobViewer } from "./types";
import type { JobFlowState } from "./use-job-flow-state";

/** Live GPS only after Start trip (map is shown). Ready-to-go has no map. */
export function useTripLocationPush(
  job: JobRecord | null,
  viewer: JobViewer,
  actorId: string,
  s: JobFlowState,
) {
  const { setJob, jobRef, setLocHint } = s;
  useEffect(() => {
    if (!job) return;
    const tracking = ["en_route", "arrived", "in_progress"].includes(
      job.status,
    );
    if (!tracking || !navigator.geolocation) return;

    let cancelled = false;

    // DATA: no watchPosition stream + no Google matrix per ping.
    // One interval every 30s is enough for map movement on mobile.
    let lastPushAt = 0;
    let inflight = false;
    const PUSH_MIN_MS = 28_000;

    const push = async (lat: number, lng: number) => {
      if (cancelled || inflight) return;
      const now = Date.now();
      if (now - lastPushAt < PUSH_MIN_MS) return;
      lastPushAt = now;
      inflight = true;
      try {
        const res = await apiPushTripLocation({
          jobId: job.id,
          lat,
          lng,
          actor: viewer,
          actorId,
        });
        if (!cancelled && res.ok) {
          // Merge slim location payload into current job (API no longer returns full job)
          const patch = res.data.job as Partial<JobRecord>;
          setJob((prev) => {
            if (!prev || prev.id !== job.id) return prev;
            const next = {
              ...prev,
              ...patch,
              // Keep rich fields that slim response omits
              offers: prev.offers,
              photos: prev.photos,
              voiceNote: prev.voiceNote,
              problem: prev.problem,
              motoristName: prev.motoristName,
              repairProName: prev.repairProName,
              statusHistory: prev.statusHistory,
            } as JobRecord;
            jobRef.current = next;
            return next;
          });
          setLocHint(null);
        }
      } catch {
        /* network blip */
      } finally {
        inflight = false;
      }
    };

    const sample = () => {
      if (document.hidden) return;
      void getCurrentPosition({
        enableHighAccuracy: false,
        maximumAge: 25_000,
        timeout: 6000,
      })
        .then((p) => push(p.coords.latitude, p.coords.longitude))
        .catch(() => undefined);
    };

    sample();
    const poll = window.setInterval(sample, 45_000);

    setLocHint(null);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [viewer, job?.id, job?.status, actorId, setJob, jobRef, setLocHint]);
}
