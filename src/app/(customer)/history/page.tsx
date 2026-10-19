"use client";

/**
 * History past bookings (completed, cancelled, expired, etc.) with filters.
 * View-only process; no chat.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText } from "lucide-react";
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
    <div className="ona2 relative flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
        <h1 className="px-5 pt-5 text-[22px] font-bold leading-tight tracking-tight text-ona-ink">
          Booking History
        </h1>

        <div
          role="group"
          aria-label="Filter bookings"
          className="mt-3 flex gap-2 overflow-x-auto px-5 scrollbar-hide"
        >
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(filter === f.id ? null : f.id)}
                className="flex h-11 shrink-0 items-center border-0 bg-transparent px-0.5"
              >
                <span
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-semibold",
                    on ? "bg-ona-brand-btn text-white" : "text-ona-muted",
                  )}
                >
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 px-5 pb-6 pt-2">
          <p className="text-[12px] leading-snug text-ona-muted">
            You can still dispute a closed job within 48 hours after job
            Finished.
          </p>

          {loading && <JobListLoading />}
          {err && <JobListError message={err} />}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center rounded-ona-card border border-ona-border bg-ona-surface px-6 py-14 text-center">
              <span
                aria-hidden
                className="flex h-24 w-24 items-center justify-center rounded-full bg-ona-field-strong text-ona-muted"
              >
                <ReceiptText className="h-10 w-10" strokeWidth={1.5} />
              </span>
              <p className="mt-5 text-[15px] font-semibold text-ona-ink">
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
