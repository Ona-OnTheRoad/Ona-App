import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { formatWhenFull } from "./format-when";
import { hasReached } from "./request-detail-helpers";
import { DetailRow, Section } from "./request-detail-primitives";

export function RequestProgressSections({
  job,
  enRouteAt,
  arrivedAt,
  workAt,
  completedAt,
  satisfiedAt,
  ink,
  muted,
}: {
  job: JobRecord;
  enRouteAt: string | null;
  arrivedAt: string | null;
  workAt: string | null;
  completedAt: string | null;
  satisfiedAt: string | null | undefined;
  ink: string;
  muted: string;
}) {
  return (
    <>
      <Section title="Trip" muted={muted}>
        <DetailRow
          label="En route"
          value={
            enRouteAt || hasReached(job, "en_route")
              ? formatWhenFull(enRouteAt) || "Started"
              : "Not started"
          }
          ink={ink}
          muted={muted}
        />
        <DetailRow
          label="Meet location"
          value={job.locationLabel?.trim() || "Not set"}
          ink={ink}
          muted={muted}
        />
        {(job.distanceText || job.distanceKm != null) && (
          <DetailRow
            label="Distance"
            value={
              job.distanceText ||
              (job.distanceKm != null
                ? `${job.distanceKm.toFixed(1)} km`
                : "Not set")
            }
            ink={ink}
            muted={muted}
          />
        )}
        {(job.etaText || job.etaMinutes != null) && (
          <DetailRow
            label="ETA (last)"
            value={
              job.etaText ||
              (job.etaMinutes != null ? `${job.etaMinutes} min` : "Not set")
            }
            ink={ink}
            muted={muted}
          />
        )}
      </Section>

      <Section title="Arrival" muted={muted}>
        <DetailRow
          label="Arrived on site"
          value={
            arrivedAt || hasReached(job, "arrived")
              ? formatWhenFull(arrivedAt) || "Yes"
              : "Not recorded"
          }
          ink={ink}
          muted={muted}
        />
        <DetailRow
          label="Work started"
          value={
            workAt || hasReached(job, "in_progress")
              ? formatWhenFull(workAt) || "Yes"
              : "Not set"
          }
          ink={ink}
          muted={muted}
        />
      </Section>

      <Section title="Completion" muted={muted}>
        <DetailRow
          label="Work complete"
          value={
            completedAt || hasReached(job, "completed")
              ? formatWhenFull(completedAt) || "Yes"
              : "Not set"
          }
          ink={ink}
          muted={muted}
        />
        <DetailRow
          label="Customer confirmed"
          value={
            satisfiedAt || hasReached(job, "satisfied")
              ? formatWhenFull(satisfiedAt) || "Yes"
              : "Not set"
          }
          ink={ink}
          muted={muted}
        />
      </Section>

      {job.dispute && (
        <Section title="Dispute" muted={muted}>
          <DetailRow
            label="Opened by"
            value={job.dispute.openedBy.replace(/_/g, " ")}
            ink={ink}
            muted={muted}
          />
          <DetailRow
            label="Reason"
            value={job.dispute.reason.replace(/_/g, " ")}
            ink={ink}
            muted={muted}
          />
          <DetailRow
            label="Status"
            value={job.dispute.status.replace(/_/g, " ")}
            ink={ink}
            muted={muted}
          />
          {job.dispute.description?.trim() && (
            <p className={cn("mt-2 text-[13px] font-medium leading-snug", ink)}>
              {job.dispute.description.trim()}
            </p>
          )}
        </Section>
      )}
    </>
  );
}
