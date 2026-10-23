"use client";
import type { JobTrigger } from "@/lib/jobs/diagnostics/types";


/**
 * Requests Live help & dispatch.
 * Active jobs open the live job flow. Past jobs open a view-only process summary (no chat).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VerificationBlockedPanel,
  VerificationWarningBanner,
} from "@/components/auth/verification-gate-banner";
import { PageHeader } from "@/components/layout/page-header";
import {
  ClosedJobDialog,
  useClosedJobDialog,
} from "@/components/requests/closed-job-dialog";
import { formatWhenShort } from "@/components/requests/format-when";
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
import type { JobFlowStatus, JobRecord } from "@/lib/jobs/types";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const OPEN: JobFlowStatus[] = [
  "scheduled",
  "waiting_for_selected",
  "selected_review",
  "sequential_pairing",
  "waiting_for_pro",
  "reserved",
  "negotiating",
  "agreed",
  "paid_booked",
  "en_route",
  "arrived",
  "in_progress",
];

export default function RequestsPage() {
  const router = useRouter();
  const { theme, accountType, backendUserId } = useApp();
  const isLight = theme === "light";
  const isPro = accountType === "professional";
  const viewer = isPro ? "repair_pro" : "motorist";

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const closedDialog = useClosedJobDialog();
  const { setClosedOpen, setViewHref } = closedDialog;

  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-700" : "text-white/75";
  const stage = isLight ? "bg-[#c8c9cd]" : "bg-black";

  const load = useCallback(async (trigger: JobTrigger = "action") => {
    if (!backendUserId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    const res = await apiListJobs(backendUserId, viewer, { diagnostic: { source: "requests-page", trigger } });
    if (!res.ok) {
      setErr(res.message);
      setLoading(false);
      return;
    }
    const list = sortByRecent(
      res.data.jobs.filter((j) => {
        if (!j.problem?.trim()) return false;
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
    void load("initial");
    const t = window.setInterval(() => {
      if (document.hidden) return;
      void load("interval");
    }, 180_000);
    return () => window.clearInterval(t);
  }, [load]);

  const { active, past } = useMemo(() => {
    const a: JobRecord[] = [];
    const p: JobRecord[] = [];
    for (const j of jobs) {
      if (OPEN.includes(j.status)) a.push(j);
      else if (PAST_STATUSES.includes(j.status)) p.push(j);
      else p.push(j);
    }
    return { active: a, past: p };
  }, [jobs]);

  const openJob = (j: JobRecord) => {
    if (OPEN.includes(j.status)) {
      router.push(`/jobs/${j.id}`);
      return;
    }
    // Past / closed: popup first, View opens process summary
    setViewHref(`/requests/${j.id}`);
    setClosedOpen(true);
  };

  const renderRow = (j: JobRecord) => {
    const isOpen = OPEN.includes(j.status);
    return (
      <JobRow
        key={j.id}
        j={j}
        name={jobRowName(j, isPro)}
        skill={jobRowSkill(j)}
        when={formatWhenShort(j.updatedAt || j.createdAt)}
        suffix={!isOpen ? " · View only" : ""}
        badgeClass={
          isOpen
            ? "bg-[#FF6B35] text-white"
            : isLight
              ? "bg-transparent text-slate-700 ring-1 ring-black/15"
              : "bg-transparent text-white/80 ring-1 ring-white/25"
        }
        statusText={jobRowStatusLabel(j.status, isPro)}
        isLight={isLight}
        ink={ink}
        muted={muted}
        onClick={() => openJob(j)}
      />
    );
  };

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", stage)}>
      <PageHeader title="Requests" subtitle="Live help & dispatch" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
        {warning && (
          <VerificationWarningBanner
            message={warning}
            isLight={isLight}
            onDismiss={() => setWarning(null)}
          />
        )}
        {blocked && (
          <VerificationBlockedPanel
            message={blocked}
            isLight={isLight}
            onClose={() => setBlocked(null)}
          />
        )}

        {loading && <JobListLoading />}

        {err && <JobListError message={err} />}

        {!loading && jobs.length === 0 && (
          <div className="py-14 text-center">
            <p className={cn("text-[15px] font-semibold", ink)}>
              No requests yet
            </p>
            <p className={cn("mt-1 text-[12px] font-medium", muted)}>
              {isPro
                ? "New motorist requests will show here."
                : "Request help from Home to start."}
            </p>
            {!isPro && (
              <Link
                href="/"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#FF6B35] px-5 text-[13px] font-semibold text-white"
              >
                Find help nearby
              </Link>
            )}
          </div>
        )}

        {!loading && active.length > 0 && (
          <section className="mb-6">
            <p
              className={cn(
                "mb-1 text-[11px] font-semibold uppercase tracking-wide",
                muted,
              )}
            >
              Active
            </p>
            <div>{active.map(renderRow)}</div>
          </section>
        )}

        {!loading && past.length > 0 && (
          <section>
            <p
              className={cn(
                "mb-1 text-[11px] font-semibold uppercase tracking-wide",
                muted,
              )}
            >
              Past
            </p>
            <p
              className={cn("mb-2 text-[11px] font-medium leading-snug", muted)}
            >
              Tap a past request to view the full process. Chat is closed view
              only.
            </p>
            <div>{past.map(renderRow)}</div>
          </section>
        )}
      </div>

      <ClosedJobDialog {...closedDialog} isLight={isLight} />
    </div>
  );
}
