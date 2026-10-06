"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import { fmtClock } from "@/components/admin/dispatch/format";
import type { DispatchJob, Summary } from "@/components/admin/dispatch/types";
import { DispatchStatCards } from "@/components/admin/dispatch/stat-cards";
import {
  JobCooldownCell,
  JobStatusCell,
} from "@/components/admin/dispatch/job-cells";
import { JobControlsCell } from "@/components/admin/dispatch/job-controls-cell";

export default function AdminDispatchPage() {
  const { adminName, ready, api, router } = useAdminGate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [queue, setQueue] = useState<DispatchJob[]>([]);
  const [availablePros, setAvailablePros] = useState<
    { id: string; name: string }[]
  >([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      setError(res.message);
      return;
    }
    setSummary(res.data.summary);
    setQueue(res.data.queue);
    setAvailablePros(res.data.availablePros);
    setError(null);
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
    setMsg(null);
    setError(null);
    setBusyId(job.id);
    const body: Record<string, unknown> = { action, jobId: job.id };
    if (action === "reassign") {
      const proId = setProOptions.get(job.id);
      if (!proId) {
        setError("Pick a pro first");
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
      setError(res.message);
      return;
    }
    setMsg(`Done: ${action} → ${res.data.job.flowStatus}`);
    void load();
  }

  return (
    <AdminShell adminName={adminName}>
      <h1 className="om-admin-h1">Dispatch board</h1>
      <p className="om-admin-sub">
        Live request/dispatch monitoring SSPE pairing (66s per pro), searching,
        negotiation, deferrals (5 min), per-request decline exclusions, and
        admin controls to reroute, reassign, clear cooldowns, or expire.
      </p>

      <AdminGuideBanner pageId="jobs" />

      {error ? <div className="om-admin-error">{error}</div> : null}
      {msg ? <div className="om-admin-success">{msg}</div> : null}

      <DispatchStatCards summary={summary} />

      <div className="om-admin-panel" style={{ marginTop: 14 }}>
        <div className="om-admin-toolbar">
          <strong>
            Active requests{" "}
            <span className="om-admin-muted">
              · refresh {lastRefresh || "…"} (auto 5s)
            </span>
          </strong>
        </div>
        <div className="om-admin-table-scroll">
          <table className="om-admin-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Customer → Pro</th>
                <th>Status</th>
                <th>Cooldowns / timers</th>
                <th>Controls</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="om-admin-muted">
                    No active requests right now.
                  </td>
                </tr>
              ) : (
                queue.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{j.serviceType}</div>
                      <div className="om-admin-muted">{j.problem}</div>
                      <div className="om-admin-muted" style={{ fontSize: 10 }}>
                        {j.id.slice(0, 8)} · created {fmtClock(j.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div>{j.motoristName}</div>
                      <div className="om-admin-muted">↓</div>
                      <div>{j.proName}</div>
                    </td>
                    <JobStatusCell j={j} />
                    <JobCooldownCell j={j} />
                    <JobControlsCell
                      j={j}
                      busyId={busyId}
                      proValue={setProOptions.get(j.id) || ""}
                      availablePros={availablePros}
                      onAction={(action, job) => void runAction(action, job)}
                      onProChange={(jobId, proId) =>
                        setReassignPro((s) => ({ ...s, [jobId]: proId }))
                      }
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
