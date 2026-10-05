"use client";

/**
 * History past bookings (completed, cancelled, expired, etc.) with filters.
 * View-only process; no chat.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  ClosedJobDialog,
  useClosedJobDialog,
} from "@/components/requests/closed-job-dialog";
import { formatWhenWithYear } from "@/components/requests/format-when";
import { JobRow } from "@/components/requests/job-row";
import {
  PAST_STATUSES,
  jobRowName,
  jobRowSkill,
  jobRowStatusLabel,
  sortByRecent,
} from "@/components/requests/job-row-helpers";
import {
  JobListError,
  JobListLoading,
} from "@/components/requests/job-list-states";
import { apiListJobs } from "@/lib/jobs/client";
import { canOpenDisputeNow } from "@/lib/jobs/constants";
import type { JobFlowStatus, JobRecord } from "@/lib/jobs/types";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type HistoryFilter =
  "completed" | "cancelled" | "expired" | "refunded" | "disputed";

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "expired", label: "Expired" },
  { id: "refunded", label: "Refunded" },
  { id: "disputed", label: "Disputed" },
];

function matchesFilter(
  status: JobFlowStatus,
  f: HistoryFilter | null,
): boolean {
  if (!f) return true;
  if (f === "completed")
    return (
      status === "completed" || status === "satisfied" || status === "released"
    );
  if (f === "cancelled") return status === "cancelled";
  if (f === "expired") return status === "expired";
  if (f === "refunded") return status === "refunded";
  if (f === "disputed")
    return status === "disputed" || status === "under_appeal";
  return false;
}

export default function HistoryPage() {
  const router = useRouter();
  const { theme, accountType, backendUserId } = useApp();
  const isLight = theme === "light";
  const isPro = accountType === "professional";
  const viewer = isPro ? "repair_pro" : "motorist";

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter | null>(null);
  const closedDialog = useClosedJobDialog();
  const { setClosedOpen, setViewHref } = closedDialog;

  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-700" : "text-white/75";
  const stage = isLight ? "bg-[#c8c9cd]" : "bg-black";

  const load = useCallback(async () => {
    if (!backendUserId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    const res = await apiListJobs(backendUserId, viewer);
    if (!res.ok) {
      setErr(res.message);
      setLoading(false);
      return;
    }
    const list = sortByRecent(
      res.data.jobs.filter((j) => {
        if (!j.problem?.trim()) return false;
        if (!PAST_STATUSES.includes(j.status)) return false;
        if (viewer === "repair_pro" && j.repairProId !== backendUserId)
          return false;
        if (viewer === "motorist" && j.motoristId !== backendUserId)
          return false;
        return true;
      }),
    );
    setJobs(list);
    setErr(null);
    setLoading(false);
  }, [backendUserId, viewer]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => jobs.filter((j) => matchesFilter(j.status, filter)),
    [jobs, filter],
  );

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", stage)}>
      <PageHeader
        title="History"
        subtitle="Past bookings · view only"
        backHref={isPro ? "/dashboard" : "/"}
      />

      {/* All filters + content on one continuous scrollable page */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
        <div className="mb-3 flex w-full items-stretch overflow-hidden rounded-xl">
          {FILTERS.map((f, i) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(filter === f.id ? null : f.id)}
                className={cn(
                  "flex-1 border-0 px-1 py-2 text-[11px] font-semibold transition",
                  i > 0 &&
                    (isLight
                      ? "border-l border-black/20"
                      : "border-l border-white/20"),
                  on
                    ? "bg-[#FF6B35] text-white"
                    : isLight
                      ? "bg-black/[0.06] text-slate-700"
                      : "bg-white/10 text-white/80",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <p className={cn("mb-3 text-[11px] font-medium leading-snug", muted)}>
          You can still dispute a closed job within 48 hours after job Finished.
        </p>

        {loading && <JobListLoading />}
        {err && <JobListError message={err} />}
        {!loading && filtered.length === 0 && (
          <div className="py-14 text-center">
            <p className={cn("text-[15px] font-semibold", ink)}>
              No history yet
            </p>
            <p className={cn("mt-1 text-[12px] font-medium", muted)}>
              {filter == null
                ? "Finished and cancelled jobs will appear here."
                : `No ${FILTERS.find((x) => x.id === filter)?.label.toLowerCase()} jobs yet.`}
            </p>
          </div>
        )}

        {!loading &&
          filtered.map((j) => (
            <JobRow
              key={j.id}
              j={j}
              name={jobRowName(j, isPro)}
              skill={jobRowSkill(j)}
              when={formatWhenWithYear(j.updatedAt || j.createdAt)}
              suffix={
                canOpenDisputeNow(j)
                  ? " · Dispute available (48h)"
                  : " · View only"
              }
              badgeClass={
                isLight
                  ? "text-slate-800 ring-1 ring-black/15"
                  : "text-white/90 ring-1 ring-white/25"
              }
              statusText={jobRowStatusLabel(j.status, isPro)}
              isLight={isLight}
              ink={ink}
              muted={muted}
              onClick={() => {
                // Within 48h of satisfied: open live job for dispute; else read-only
                if (canOpenDisputeNow(j)) {
                  router.push(`/jobs/${j.id}`);
                  return;
                }
                setViewHref(`/requests/${j.id}`);
                setClosedOpen(true);
              }}
            />
          ))}
      </div>

      <ClosedJobDialog {...closedDialog} isLight={isLight} />
    </div>
  );
}
