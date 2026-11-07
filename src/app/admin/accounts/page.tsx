"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { AccountsStatCards } from "@/components/admin/accounts/accounts-stat-cards";
import {
  AccountsTabs,
  type AccountsTab,
} from "@/components/admin/accounts/accounts-tabs";
import { DuplicateIdentitiesTab } from "@/components/admin/accounts/duplicate-identities-tab";
import { SyncEventsTab } from "@/components/admin/accounts/sync-events-tab";
import type { Board, MergeCandidate } from "@/components/admin/accounts/types";
import { Loader2 } from "lucide-react";

export default function AdminAccountsPage() {
  const { adminName, adminRole, ready, api, error: gateError } = useAdminGate();
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyMerge, setBusyMerge] = useState<string | null>(null);
  const [primaryOverride, setPrimaryOverride] = useState<
    Record<string, "primary" | "duplicate">
  >({});
  const [currentTab, setCurrentTab] = useState<AccountsTab>("duplicates");
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<Board>("/api/admin/identity");
      if (!res.ok) {
        setError(res.message || "Failed to load identity board");
        return;
      }
      setData(res.data);
      setError(null);
    } catch {
      setError("Failed to load identity board from network");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  // Periodic polling for sync events
  useEffect(() => {
    if (!ready) return;
    timerRef.current = window.setInterval(() => void load(), 30_000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [ready, load]);

  async function scan() {
    setMsg(null);
    setError(null);
    setScanning(true);
    try {
      const res = await api<{ message: string }>("/api/admin/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      if (!res.ok) {
        setError(res.message || "Scan failed");
        return;
      }
      setMsg(res.data.message || "Scan completed");
      await load();
    } catch {
      setError("Network error while scanning for duplicates");
    } finally {
      setScanning(false);
    }
  }

  async function decide(candidate: MergeCandidate, action: "merge" | "reject") {
    setMsg(null);
    setError(null);
    setBusyMerge(candidate.id);
    const body: Record<string, unknown> = { action };
    if (action === "merge") {
      const which = primaryOverride[candidate.id] || "primary";
      body.primaryUserId =
        which === "primary"
          ? candidate.primary_user_id
          : candidate.duplicate_user_id;
    }
    try {
      const res = await api<{ message?: string }>(
        `/api/admin/identity/merges/${candidate.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        setError(res.message || "Action failed");
        return;
      }
      setMsg(
        action === "merge"
          ? "Accounts merged into one identity history, roles and payout preserved."
          : "Merge candidate rejected.",
      );
      await load();
    } catch {
      setError("Network error performing merge action");
    } finally {
      setBusyMerge(null);
    }
  }

  const failure = gateError || error;

  // Initial Loading State - Avoids Empty State Flash
  if (!ready || (loading && !data)) {
    return (
      <AdminShell
        adminName={adminName}
        title="Accounts & sync"
        subtitle="Auth reconciliation and profile sync."
        guideKey="accounts"
      >
        <div className="flex items-center justify-center min-h-[50vh] text-gray-400 dark:text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-ona-brand" />
          Loading accounts & sync…
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      adminName={adminName}
      title="Accounts & sync"
      subtitle="Auth reconciliation and profile sync."
      guideKey="accounts"
    >
      {/* Alert Messages */}
      {failure ? (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium leading-relaxed">
          {failure}
        </div>
      ) : null}
      {msg ? (
        <div className="mb-5 p-3.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-medium leading-relaxed">
          {msg}
        </div>
      ) : null}

      {/* 5 Metric Summary Cards */}
      <AccountsStatCards
        motoristOnly={data?.summary.motoristOnly ?? 0}
        proOnly={data?.summary.proOnly ?? 0}
        dual={data?.summary.dual ?? 0}
        needsSync={data?.summary.needsSync ?? 0}
        pendingMerges={data?.summary.pendingMerges ?? 0}
      />

      {/* Segmented Tab Navigation */}
      <AccountsTabs currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Tab Panels */}
      {currentTab === "duplicates" && (
        <DuplicateIdentitiesTab
          data={data}
          primaryOverride={primaryOverride}
          setPrimaryOverride={setPrimaryOverride}
          busyMerge={busyMerge}
          scanning={scanning}
          onScan={() => void scan()}
          onDecide={(cand, act) => void decide(cand, act)}
        />
      )}

      {currentTab === "sync_events" && (
        <SyncEventsTab events={data?.syncLog ?? []} />
      )}
    </AdminShell>
  );
}
