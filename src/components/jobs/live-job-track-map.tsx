"use client";

/**
 * Live trip map: dual pins + copper route.
 * Motorist sees Repair Pro movement; pro sees motorist location.
 * Colors match customer dashboard map in both themes
 * (light → green-black, dark → red-black) with street/POI labels forced on.
 */

import { shouldUseLiveMaps } from "@/lib/google-maps";
import { mapThemeForApp } from "@/lib/map-theme";
import type { JobRecord } from "@/lib/jobs/types";
import { formatDistance, formatEta } from "@/lib/utils";
import { GoogleTrackMap } from "./live-job-track-map/google-track-map";
import { OsmFallback } from "./live-job-track-map/osm-fallback";
import { tripProTechnicians } from "./live-job-track-map/pro-technicians";
import { TripMapStatsBar } from "./live-job-track-map/trip-map-stats-bar";

export function LiveJobTrackMap({
  job,
  isLight,
  viewer = "motorist",
}: {
  job: JobRecord;
  isLight: boolean;
  viewer?: "motorist" | "repair_pro";
}) {
  if (!shouldUseLiveMaps()) {
    return (
      <div
        className="relative h-full w-full"
        style={{ backgroundColor: mapThemeForApp(isLight).backgroundColor }}
      >
        <OsmFallback technicians={tripProTechnicians(job, job.proLocation)} />
        <TripMapStatsBar
          time={
            job.etaText ||
            (job.etaMinutes != null ? formatEta(job.etaMinutes) : "Not set")
          }
          distance={
            job.distanceText ||
            (job.distanceKm != null
              ? formatDistance(job.distanceKm)
              : "Not set")
          }
          isLight={isLight}
        />
      </div>
    );
  }

  return <GoogleTrackMap job={job} isLight={isLight} viewer={viewer} />;
}
