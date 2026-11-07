"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { toastError, toastSuccess } from "@/lib/toast";
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
  const [busyMerge, setBusyMerge] = useState<string | null>(null);
  const [primaryOverride, setPrimaryOverride] = useState<
    Record<string, "primary" | "duplicate">
  >({});
  const [currentTab, setCurrentTab] = useState<AccountsTab>("duplicates");
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<Board>("/api/admin/identity");
      if (!res.ok) {
        toastError(res.message || "Failed to load identity board");
        return;
      }
      setData(res.data);
    } catch {
      toastError("Failed to load identity board from network");
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
    setScanning(true);
    try {
      const res = await api<{ message: string }>("/api/admin/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      if (!res.ok) {
        toastError(res.message || "Scan failed");
        return;
      }
      toastSuccess(res.data.message || "Scan completed");
      await load();
    } catch {
      toastError("Network error while scanning for duplicates");
    } finally {
      setScanning(false);
    }
  }

  async function decide(candidate: MergeCandidate, action: "merge" | "reject") {
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
        toastError(res.message || "Action failed");
        return;
      }
      toastSuccess(
        action === "merge"
          ? "Accounts merged into one identity history, roles and payout preserved."
          : "Merge candidate rejected.",
      );
      await load();
    } catch {
      toastError("Network error performing merge action");
    } finally {
      setBusyMerge(null);
    }
  }

  useEffect(() => {
    if (gateError) toastError(gateError);
  }, [gateError]);


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
