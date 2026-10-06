"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import {
  type Board,
  type MergeCandidate,
} from "@/components/admin/accounts/types";
import { MergePanel } from "@/components/admin/accounts/merge-table";
import { SyncLogPanel } from "@/components/admin/accounts/sync-log-panel";

export default function AdminAccountsPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [data, setData] = useState<Board | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyMerge, setBusyMerge] = useState<string | null>(null);
  const [primaryOverride, setPrimaryOverride] = useState<
    Record<string, "primary" | "duplicate">
  >({});
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/identity");
    const json = await res.json();
    if (!json.ok) {
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      setError(json.error?.message || "Failed to load identity board");
      return;
    }
    setData(json.data);
    setError(null);
    setLastRefresh(new Date().toLocaleTimeString([], { hour12: false }));
  }, [router]);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/admin/auth/me");
      const meJson = await me.json();
      if (!meJson.ok) {
        router.replace("/admin/login");
        return;
      }
      setAdminName(meJson.data.fullName || meJson.data.email);
      await load();
    })();
  }, [load, router]);

  useEffect(() => {
    timerRef.current = window.setInterval(() => void load(), 30_000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [load]);

  async function scan() {
    setMsg(null);
    setError(null);
    const res = await fetch("/api/admin/identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "scan" }),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message || "Scan failed");
      return;
    }
    setMsg(json.data.message);
    await load();
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
    const res = await fetch(`/api/admin/identity/merges/${candidate.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setBusyMerge(null);
    if (!json.ok) {
      setError(json.error?.message || "Action failed");
      return;
    }
    setMsg(
      action === "merge"
        ? "Accounts merged into one identity history, roles and payout preserved."
        : "Merge candidate rejected.",
    );
    await load();
  }

  const statCards = useMemo(() => {
    const s = data?.summary;
    return [
      {
        label: "Customer only",
        value: s?.motoristOnly ?? "",
        sub: "motorist side only",
        tone: "available",
      },
      {
        label: "Repair Pro only",
        value: s?.proOnly ?? "",
        sub: "pro side only",
        tone: "pending",
      },
      {
        label: "Both roles",
        value: s?.dual ?? "",
        sub: "one identity, two roles",
        tone: "ledger",
      },
      {
        label: "Needs sync",
        value: s?.needsSync ?? "",
        sub: "role registry mismatch",
        tone: "held",
      },
      {
        label: "Pending merges",
        value: s?.pendingMerges ?? "",
        sub: "duplicate identities",
        tone: "failed",
      },
    ];
  }, [data]);

  return (
    <AdminShell adminName={adminName}>
      <h1 className="om-admin-h1">Accounts & identity sync</h1>
      <p className="om-admin-sub">
        One person = one identity with optional Customer + Repair Pro roles.
        Role registry, canonical payout record, merge queue and sync audit live
        here. Refresh {lastRefresh || "…"} (auto 30s).
      </p>

      <AdminGuideBanner pageId="users" />

      {error ? <div className="om-admin-error">{error}</div> : null}
      {msg ? (
        <div
          className="om-admin-error"
          style={{ background: "#14532d", color: "#bbf7d0", marginBottom: 12 }}
        >
          {msg}
        </div>
      ) : null}

      <div className="om-admin-stat-grid">
        {statCards.map((c) => (
          <div className="om-admin-stat-card" data-tone={c.tone} key={c.label}>
            <div className="om-admin-stat-label">{c.label}</div>
            <div className="om-admin-stat-value">{c.value}</div>
            <div className="om-admin-stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>
      <MergePanel
        data={data}
        primaryOverride={primaryOverride}
        setPrimaryOverride={setPrimaryOverride}
        busyMerge={busyMerge}
        onScan={() => void scan()}
        onDecide={(candidate, action) => void decide(candidate, action)}
      />

      <SyncLogPanel data={data} />
    </AdminShell>
  );
}
