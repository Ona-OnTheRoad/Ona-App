"use client";

/**
 * History past bookings (completed, cancelled, expired, etc.) with filters.
 * View-only process; no chat.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
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

const FILTERS: { id: HistoryFilter | null; label: string }[] = [
  { id: null, label: "All" },
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

  const load = useCallback(async () => {
    if (!backendUserId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    const res = await apiListJobs(backendUserId, viewer, { diagnostic: { source: "history", trigger: "initial" } });
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
    <div className="ona2 relative flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide flex flex-col pb-[calc(var(--dock-space,4.5rem)+1rem)]">
        <h1 className="shrink-0 px-5 pt-5 text-[22px] font-bold leading-tight tracking-tight text-ona-ink">
          Booking History
        </h1>

        <div
          role="group"
          aria-label="Filter bookings"
          className="mt-3 flex shrink-0 gap-2 overflow-x-auto px-5 scrollbar-hide"
        >
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id ?? "all"}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.id)}
                className="flex h-11 shrink-0 items-center border-0 bg-transparent px-0.5 cursor-pointer"
              >
                <span
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    on ? "bg-ona-brand-btn text-white" : "text-ona-muted",
                  )}
                >
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col space-y-3 px-5 pb-6 pt-2">
          <p className="text-[12px] leading-snug text-ona-muted">
            You can still dispute a closed job within 48 hours after job
            Finished.
          </p>

          {loading && <JobListLoading />}
          {err && <JobListError message={err} />}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center rounded-ona-card border border-ona-border bg-ona-surface px-6 py-12 text-center shadow-xs my-auto min-h-[380px]">
              <div className="mb-2 flex items-center justify-center">
                <NoHistoryIllustration className="h-44 w-52 max-w-full" />
              </div>
              <p className="mt-3 text-[16px] font-semibold text-ona-ink">
                No history yet
              </p>
              <p className="mt-1 text-[13px] text-ona-muted">
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
                variant="card"
                j={j}
                photoUrl={isPro ? j.motoristPhoto : j.repairProPhoto}
                name={jobRowName(j, isPro)}
                skill={jobRowSkill(j)}
                when={formatWhenWithYear(j.updatedAt || j.createdAt)}
                suffix={
                  canOpenDisputeNow(j)
                    ? " · Dispute available (48h)"
                    : " · View only"
                }
                badgeClass=""
                statusText={jobRowStatusLabel(j.status, isPro)}
                isLight={isLight}
                ink=""
                muted=""
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
      </div>

      <ClosedJobDialog {...closedDialog} isLight={isLight} />
    </div>
  );
}
