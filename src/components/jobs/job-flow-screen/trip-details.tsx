import type { ReactElement } from "react";
import { Navigation } from "lucide-react";
import { JobShopRecommend } from "@/components/jobs/job-shop-recommend";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import type { JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
  ink: string;
  muted: string;
  isReadyToGo: boolean;
  isPostArrival: boolean;
}

/**
 * Pro still sees the navigate cue while en route (not after arrival); the
 * address block is hidden for the customer entirely.
 */
export function TripDetails({
  job,
  viewer,
  isLight,
  ink,
  muted,
  isReadyToGo,
  isPostArrival,
}: Props): ReactElement {
  return (
    <>
      {/*
  Address + “live on map” block:
 Hidden for customer (motorist) entirely
 Pro still sees navigate cue while en route (not after arrival)
 */}
      {viewer === "repair_pro" && !isReadyToGo && !isPostArrival && (
        <div className="flex items-start gap-2">
          <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B35]" />
          <div className="min-w-0">
            <p className={cn("text-[13px] font-semibold break-words", ink)}>
              {job.locationLabel || "Location on map"}
            </p>
            <p className={cn("mt-0.5 text-[11px] font-medium", muted)}>
              Navigate to pin
            </p>
          </div>
        </div>
      )}

      {job.id && (viewer === "repair_pro" || viewer === "motorist") ? (
        <JobShopRecommend
          jobId={job.id}
          isLight={isLight}
          canEdit={viewer === "repair_pro"}
        />
      ) : null}
    </>
  );
}
