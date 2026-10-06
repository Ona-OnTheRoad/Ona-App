import { apiTransition, getCurrentPosition } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import type { TripEvent } from "./types";

/** Status label shown on the trip chip, by job status. */
export const TRIP_STATUS_LABEL: Record<string, string> = {
  paid_booked: "Booked",
  // Exact product label do not uppercase in CSS (would become ONTHEROAD)
  en_route: "OnTheRoad",
  arrived: "Arrived",
  in_progress: "Working",
};

export const PRO_TRIP_ACTIONS: {
  when: string[];
  event: TripEvent;
  label: string;
}[] = [
  { when: ["paid_booked"], event: "START_TRIP", label: "Start trip" },
  { when: ["en_route"], event: "MARK_ARRIVED", label: "I’ve arrived" },
  { when: ["arrived"], event: "START_WORK", label: "Start work" },
  {
    when: ["in_progress", "arrived"],
    event: "MARK_COMPLETED",
    label: "Mark job complete",
  },
];

interface Deps {
  job: JobRecord;
  actorId: string;
  arrivalOk: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
  setLocHint: (v: string | null) => void;
  setFlash: (v: string | null) => void;
  commitJob: (next: JobRecord, force?: boolean) => void;
}

/** Builds the pro's trip-advance handler (Start trip → … → Mark complete). */
export function createProAdvance({
  job,
  actorId,
  arrivalOk,
  setBusy,
  setErr,
  setLocHint,
  setFlash,
  commitJob,
}: Deps) {
  return async (event: TripEvent) => {
    if (event === "MARK_ARRIVED" && !arrivalOk) return;
    setBusy(true);
    setErr(null);
    // GPS preferred for live map, but never block the status change
    let proLat: number | undefined;
    let proLng: number | undefined;
    try {
      try {
        const pos = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 20000,
        });
        proLat = pos.coords.latitude;
        proLng = pos.coords.longitude;
      } catch {
        if (job.proLocation) {
          proLat = job.proLocation.lat;
          proLng = job.proLocation.lng;
        }
        if (event === "START_TRIP" || event === "MARK_ARRIVED") {
          setLocHint(
            "Location is limited. Enable GPS so we can confirm you are with the customer.",
          );
        }
      }

      const res = await apiTransition({
        jobId: job.id,
        event,
        actor: "repair_pro",
        actorId,
        proLat,
        proLng,
      });
      if (!res.ok) {
        setErr(res.message || "Could not update trip status. Try again.");
        return;
      }
      // Force apply never let a stale poll undo the advance
      commitJob(res.data.job, true);
      setFlash(
        event === "START_TRIP"
          ? "Trip started you’re on the road"
          : event === "MARK_ARRIVED"
            ? "Marked arrived"
            : event === "START_WORK"
              ? "Work started"
              : "Job marked complete",
      );
      window.setTimeout(() => setFlash(null), 3500);
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Could not update trip. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };
}
