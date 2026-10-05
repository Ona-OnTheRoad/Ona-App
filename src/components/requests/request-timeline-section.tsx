import { CheckCircle2 } from "lucide-react";
import type { JobFlowStatus } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { formatWhenFull } from "./format-when";
import { stepTitle } from "./request-detail-helpers";
import { Section } from "./request-detail-primitives";

export type TimelineEntry = { status: JobFlowStatus; at: string; by?: string };

export function RequestTimelineSection({
  timeline,
  isPro,
  isLight,
  ink,
  muted,
}: {
  timeline: TimelineEntry[];
  isPro: boolean;
  isLight: boolean;
  ink: string;
  muted: string;
}) {
  return (
    <>
      <Section title="Full process" muted={muted}>
        <ol className="relative space-y-0 pl-0">
          {timeline.map((h, i) => (
            <li
              key={`${h.status}-${h.at}-${i}`}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                {i < timeline.length - 1 && (
                  <span
                    className={cn(
                      "mt-1 min-h-[12px] w-px flex-1",
                      isLight ? "bg-black/15" : "bg-white/20",
                    )}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={cn("text-[14px] font-semibold", ink)}>
                  {stepTitle(h.status, isPro)}
                </p>
                <p className={cn("mt-0.5 text-[11px] font-medium", muted)}>
                  {formatWhenFull(h.at)}
                  {h.by ? ` · ${h.by.replace(/_/g, " ")}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
