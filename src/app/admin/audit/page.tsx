"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import {
  AuditTable,
  type AuditActionRow,
  type AuditPeriod,
} from "@/components/admin/audit/audit-table";
import { Loader2 } from "lucide-react";

export default function AdminAuditPage() {
  const { adminName, ready, api } = useAdminGate();
  const [actions, setActions] = useState<AuditActionRow[]>([]);
  const [period, setPeriod] = useState<AuditPeriod>("all");
  const [ytdCount, setYtdCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function loadAudit() {
      setLoading(true);
      const res = await api<{
        actions: AuditActionRow[];
        yearSummary?: { ytdCount: number };
      }>(`/api/admin/audit?period=${period}`);

      if (cancelled) return;
      if (!res.ok) {
        setError(res.message);
        setLoading(false);
        return;
      }
      setActions(res.data.actions || []);
      setYtdCount(res.data.yearSummary?.ytdCount || 0);
      setLoading(false);
    }

    void loadAudit();
    return () => {
      cancelled = true;
    };
  }, [ready, api, period]);

  return (
    <AdminShell
      adminName={adminName}
      title="Audit trail"
      subtitle="Staff action logs and system history"
      guideKey="audit"
    >
      <div className="w-full pb-16">
        {error ? (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : null}

        {/* Loading state to eliminate empty-state flash */}
        {!ready || loading ? (
          <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-ona-brand mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Loading audit logs...
            </p>
          </div>
        ) : (
          <AuditTable
            actions={actions}
            period={period}
            onPeriodChange={setPeriod}
            ytdCount={ytdCount}
          />
        )}
      </div>
    </AdminShell>
  );
}
