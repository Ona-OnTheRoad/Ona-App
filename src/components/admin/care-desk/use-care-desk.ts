"use client";

import { useCallback, useEffect, useState } from "react";
import { withSensitivePassword } from "@/components/admin/sensitive-unlock";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import type { Board, CareStatus, DashboardTotals, SearchHit } from "./types";

export function useCareDesk() {
  const {
    adminName,
    adminRole,
    roleLabel: gateRoleLabel,
    ready,
    api,
    error: gateError,
  } = useAdminGate();
  const [status, setStatus] = useState<CareStatus | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [dash, setDash] = useState<DashboardTotals | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<{
    job: Record<string, unknown>;
    escrow: Record<string, unknown> | null;
  } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [latestBackup, setLatestBackup] = useState<string | null>(null);
  const [backupSearch, setBackupSearch] = useState("");
  const [backupSnaps, setBackupSnaps] = useState<
    { id: string; fileCount: number; files: { name: string; size: number }[] }[]
  >([]);

  const refreshStatus = useCallback(async () => {
    const res = await api<CareStatus>("/api/admin/care/status");
    if (res.ok) setStatus(res.data);
    else if (res.status !== 401) setErr(res.message);
  }, [api]);

  const refreshBoard = useCallback(async () => {
    const res = await api<Board>("/api/admin/care/board");
    if (res.ok) setBoard(res.data);
  }, [api]);

  const refreshDash = useCallback(async () => {
    const res = await api<{ totals: DashboardTotals }>("/api/admin/dashboard");
    if (res.ok) setDash(res.data.totals);
  }, [api]);

  const refreshLatestBackup = useCallback(async () => {
    const q = backupSearch.trim()
      ? `?q=${encodeURIComponent(backupSearch.trim())}`
      : "";
    const res = await api<{
      latest: string | null;
      snapshots?: {
        id: string;
        fileCount: number;
        files: { name: string; size: number }[];
      }[];
    }>(`/api/admin/backup${q}`);
    if (res.ok) {
      setLatestBackup(res.data.latest);
      setBackupSnaps(res.data.snapshots || []);
    }
  }, [api, backupSearch]);

  const runBackupNow = async () => {
    setErr(null);
    setMsg(null);
    setBackupBusy(true);
    try {
      const res = await api<{
        message?: string;
        id?: string;
        path?: string;
        payments?: number;
      }>("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      const parts = [
        res.data.message ||
          (res.data.id ? `Backup saved: ${res.data.id}` : "Backup saved"),
      ];
      if (res.data.payments != null) {
        parts.push(`${res.data.payments} payment rows`);
      }
      setMsg(parts.join(" · "));
      if (res.data.id) setLatestBackup(res.data.id);
      void refreshLatestBackup();
    } catch {
      setErr("Backup network error");
    } finally {
      setBackupBusy(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    void refreshStatus();
    void refreshBoard();
    void refreshDash();
    void refreshLatestBackup();
    const t = window.setInterval(() => {
      void refreshBoard();
      void refreshDash();
    }, 60_000);
    return () => window.clearInterval(t);
  }, [ready, refreshBoard, refreshStatus, refreshDash, refreshLatestBackup]);

  // Fast re-filter when searching backup directories
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      void refreshLatestBackup();
    }, 180);
    return () => window.clearTimeout(t);
  }, [ready, backupSearch, refreshLatestBackup]);

  useEffect(() => {
    if (!ready || query.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(async () => {
      const res = await api<{ hits: SearchHit[] }>(
        `/api/admin/care/search?q=${encodeURIComponent(query.trim())}`,
      );
      if (res.ok) setHits(res.data.hits);
    }, 280);
    return () => window.clearTimeout(t);
  }, [query, ready, api]);

  const openJob = async (id: string) => {
    setSelectedJobId(id);
    setMsg(null);
    setErr(null);
    const res = await api<{
      job: Record<string, unknown>;
      escrow: Record<string, unknown> | null;
    }>(`/api/admin/care/job/${id}`);
    if (!res.ok) {
      setErr(res.message);
      setJobDetail(null);
      return;
    }
    setJobDetail(res.data);
  };

  const runAction = async (body: Record<string, unknown>, reason: string) => {
    setErr(null);
    setMsg(null);
    await withSensitivePassword(
      {
        title: "Password required",
        detail: reason,
      },
      async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/admin/care/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const json = await res.json();
          if (!json.ok) {
            setErr(json.error?.message || "Action failed");
            return;
          }
          setMsg(json.data?.message || "Done");
          void refreshBoard();
          void refreshDash();
          if (selectedJobId) void openJob(selectedJobId);
        } catch {
          setErr("Network error");
        } finally {
          setBusy(false);
          if (typeof document !== "undefined") {
            (document.activeElement as HTMLElement | null)?.blur?.();
          }
        }
      },
    );
  };

  const job = jobDetail?.job;
  const flow =
    (job?.status as string) ||
    (jobDetail?.job as { flow_status?: string })?.flow_status ||
    "";

  return {
    adminName,
    adminRole,
    gateRoleLabel,
    ready,
    gateError,
    status,
    query,
    setQuery,
    hits,
    board,
    dash,
    selectedJobId,
    jobDetail,
    msg,
    err,
    busy,
    backupBusy,
    latestBackup,
    backupSearch,
    setBackupSearch,
    backupSnaps,
    refreshBoard,
    runBackupNow,
    openJob,
    runAction,
    job,
    flow,
  };
}
