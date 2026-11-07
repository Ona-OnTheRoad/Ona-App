"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DisputesStatCards } from "@/components/admin/disputes/disputes-stat-cards";
import { DisputesTable } from "@/components/admin/disputes/disputes-table";
import { withSensitivePassword } from "@/components/admin/sensitive-unlock";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import type { JobRecord } from "@/lib/jobs/types";

export default function AdminDisputesPage() {
  const { adminName, ready, api } = useAdminGate();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [totals, setTotals] = useState({ disputed: 0, underAppeal: 0 });
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [splitPct, setSplitPct] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const res = await api<{
      jobs: JobRecord[];
      totals: { disputed: number; underAppeal: number };
    }>("/api/admin/disputes");
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setJobs(res.data.jobs);
    setTotals(res.data.totals);
  }, [api]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  const handleSplitChange = (jobId: string, pct: number) => {
    setSplitPct((prev) => ({ ...prev, [jobId]: pct }));
  };

  const handleResolve = async (
    jobId: string,
    kind: "dispute" | "appeal",
    outcome: "full_release_pro" | "full_refund_motorist" | "partial_split",
  ) => {
    setError(null);
    setFlash(null);
    await withSensitivePassword(
      {
        title: "Password required",
        detail: `Enter password to finalise this ${kind} decision.`,
      },
      async () => {
        setBusyId(jobId);
        try {
          const res = await api<{ job: JobRecord }>("/api/admin/disputes", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId,
              kind,
              outcome,
              proPercent: splitPct[jobId] ?? 70,
            }),
          });
          if (!res.ok) {
            setError(res.message);
            return;
          }
          setFlash(`Resolved ${jobId.slice(0, 8)}… → ${outcome}`);
          await load();
        } finally {
          setBusyId(null);
        }
      },
    );
  };

  return (
    <AdminShell
      adminName={adminName}
      title="Disputes & appeals"
      subtitle="Customer-pro mediation, evidence, and rulings."
      guideKey="disputes"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}
      {flash && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-900/50">
          {flash}
        </div>
      )}

      {/* 3 Metric Summary Cards */}
      <DisputesStatCards
        disputed={totals.disputed}
        underAppeal={totals.underAppeal}
        openQueue={jobs.length}
      />

      {/* Active Cases Table with Empty State */}
      <DisputesTable
        jobs={jobs}
        busyId={busyId}
        splitPct={splitPct}
        onSplitChange={handleSplitChange}
        onResolve={handleResolve}
      />
    </AdminShell>
  );
}
