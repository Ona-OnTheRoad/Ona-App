"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { SignupsStatCards } from "@/components/admin/signups/signups-stat-cards";
import {
  SignupsTable,
  type SignupEventRow,
  type SignupStatusFilter,
} from "@/components/admin/signups/signups-table";
import { Loader2 } from "lucide-react";

export default function AdminSignupsPage() {
  const { adminName, ready, api } = useAdminGate();
  const [events, setEvents] = useState<SignupEventRow[]>([]);
  const [totals, setTotals] = useState({ total: 0, success: 0, failed: 0 });
  const [statusFilter, setStatusFilter] = useState<SignupStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const q = statusFilter === "failed" ? "?failed=1" : "";
      const res = await api<{
        events: SignupEventRow[];
        totals: { total: number; success: number; failed: number };
      }>(`/api/admin/signups${q}`);

      if (!res.ok) {
        setError(res.message);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError(null);
      setEvents(res.data.events || []);
      setTotals(res.data.totals || { total: 0, success: 0, failed: 0 });
      setLoading(false);
      setRefreshing(false);
    },
    [api, statusFilter],
  );

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  return (
    <AdminShell
      adminName={adminName}
      title="Signups"
      subtitle="Onboarding funnel and drop-off rates"
      guideKey="signups"
    >
      <div className="w-full pb-16">
        {error ? (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : null}

        {/* Loading gate to prevent empty-state flash */}
        {!ready || (loading && events.length === 0) ? (
          <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-ona-brand mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Loading signup events...
            </p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <SignupsStatCards
              shown={totals.total}
              succeeded={totals.success}
              failed={totals.failed}
            />

            {/* Table */}
            <SignupsTable
              events={events}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onRefresh={() => void load(true)}
              refreshing={refreshing}
            />
          </>
        )}
      </div>
    </AdminShell>
  );
}
