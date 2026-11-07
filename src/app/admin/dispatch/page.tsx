"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { DispatchStatCards } from "@/components/admin/dispatch/stat-cards";
import { DispatchQueueTable } from "@/components/admin/dispatch/dispatch-queue-table";
import type { DispatchJob, Summary } from "@/components/admin/dispatch/types";
import { Loader2 } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toast";

export default function AdminDispatchPage() {
  const { adminName, ready, api } = useAdminGate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [queue, setQueue] = useState<DispatchJob[]>([]);
  const [availablePros, setAvailablePros] = useState<
    { id: string; name: string }[]
  >([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reassignPro, setReassignPro] = useState<Record<string, string>>({});
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    const res = await api<{
      summary: Summary;
      queue: DispatchJob[];
      availablePros: { id: string; name: string }[];
    }>("/api/admin/dispatch");
    if (!res.ok) {
      toastError(res.message);
      return;
    }
    setSummary(res.data.summary);
    setQueue(res.data.queue);
    setAvailablePros(res.data.availablePros);
    setLastRefresh(new Date().toLocaleTimeString([], { hour12: false }));
  }, [api]);

  useEffect(() => {
    if (!ready) return;
    void load();
    timerRef.current = window.setInterval(() => void load(), 5_000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [ready, load]);

  const setProOptions = useMemo(() => {
    const m = new Map<string, string>(Object.entries(reassignPro));
    for (const j of queue) {
      if (!m.has(j.id)) m.set(j.id, j.proId || "");
    }
    return m;
  }, [queue, reassignPro]);

  async function runAction(action: string, job: DispatchJob) {
    setBusyId(job.id);
    const body: Record<string, unknown> = { action, jobId: job.id };
    if (action === "reassign") {
      const proId = setProOptions.get(job.id);
      if (!proId) {
        toastError("Pick a pro first");
        setBusyId(null);
        return;
      }
      body.proId = proId;
      const pro = availablePros.find((p) => p.id === proId);
      if (pro) body.proName = pro.name;
    }
    const res = await api<{ job: DispatchJob }>("/api/admin/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusyId(null);
    if (!res.ok) {
      toastError(res.message);
      return;
    }
    toastSuccess(`Done: ${action} → ${res.data.job.flowStatus}`);
    void load();
  }

  if (!ready) {
    return (
      <AdminShell
        adminName={adminName}
        title="Dispatch board"
        subtitle="Live provider pairing, active timers, and queues."
      >
        <div className="flex items-center justify-center min-h-[50vh] text-gray-400 dark:text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-ona-brand" />
          Loading dispatch session…
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      adminName={adminName}
      title="Dispatch board"
      subtitle="Live provider pairing, active timers, and queues."
    >
      {/* 6 Metric Cards across full width */}
      <DispatchStatCards summary={summary} />

      {/* Active Requests Table / Empty State */}
      <DispatchQueueTable
        queue={queue}
        lastRefresh={lastRefresh}
        busyId={busyId}
        setProOptions={setProOptions}
        availablePros={availablePros}
        onAction={(action, job) => void runAction(action, job)}
        onProChange={(jobId, proId) =>
          setReassignPro((s) => ({ ...s, [jobId]: proId }))
        }
      />
    </AdminShell>
  );
}
