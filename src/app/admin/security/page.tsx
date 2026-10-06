"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import { cn } from "@/lib/utils";
import {
  TABS,
  rowsOf,
  sectionData,
  statsOf,
  type Tab,
} from "@/components/admin/security/types";
import { OverviewTab } from "@/components/admin/security/overview-tab";
import { ContactChangesTab } from "@/components/admin/security/contact-changes-tab";
import { NameChangesTab } from "@/components/admin/security/name-changes-tab";
import { FraudTab } from "@/components/admin/security/fraud-tab";
import { AuditTab } from "@/components/admin/security/audit-tab";

export default function AdminSecurityPage() {
  const gate = useAdminGate();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchSection = useCallback(async (section: Tab, params?: string) => {
    setLoading(true);
    try {
      const url = `/api/admin/security?section=${section}${params ? `&${params}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok) setData((prev) => ({ ...prev, [section]: json.data }));
    } catch {
      /* */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!gate.ready) return;
    void fetchSection("overview");
  }, [gate.ready, fetchSection]);

  const onAction = useCallback(
    async (action: string, body: Record<string, unknown>) => {
      setActionMsg(null);
      try {
        const res = await fetch("/api/admin/security", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...body }),
        });
        const json = await res.json();
        if (json.ok) {
          setActionMsg(`${action} succeeded`);
          void fetchSection(tab);
        } else {
          setActionMsg(json.error || "Action failed");
        }
      } catch {
        setActionMsg("Network error");
      }
      setTimeout(() => setActionMsg(null), 3000);
    },
    [tab, fetchSection],
  );

  if (!gate.ready)
    return (
      <AdminShell>
        <div className="p-6 text-[var(--om-text-muted)]">Loading...</div>
      </AdminShell>
    );
  if (gate.error)
    return (
      <AdminShell>
        <div className="p-6 text-red-500">{gate.error}</div>
      </AdminShell>
    );

  const overview = sectionData(data, "overview");
  const stats = statsOf(overview);
  const requests = rowsOf(sectionData(data, "contact-changes"), "requests");
  const nameRequests = rowsOf(sectionData(data, "name-changes"), "requests");
  const flags = rowsOf(sectionData(data, "fraud"), "flags");
  const actions = rowsOf(sectionData(data, "audit"), "actions");

  return (
    <AdminShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[18px] font-bold text-[var(--om-text)]">
            Security Control
          </h1>
          {actionMsg && (
            <span
              className={cn(
                "rounded-lg px-3 py-1 text-[11px] font-semibold",
                actionMsg.includes("succeeded")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700",
              )}
            >
              {actionMsg}
            </span>
          )}
        </div>

        <AdminGuideBanner pageId="security" />

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                void fetchSection(t.key);
              }}
              className={cn(
                "rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors",
                tab === t.key
                  ? "bg-[var(--om-accent)] text-white"
                  : "bg-[var(--om-nav)] text-[var(--om-text)] hover:bg-[var(--om-nav-hover)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-[13px] text-[var(--om-text-muted)]">Loading...</p>
        )}

        {tab === "overview" && <OverviewTab stats={stats} />}
        {tab === "contact-changes" && (
          <ContactChangesTab
            requests={requests}
            fetchSection={fetchSection}
            onAction={onAction}
          />
        )}
        {tab === "name-changes" && (
          <NameChangesTab
            nameRequests={nameRequests}
            fetchSection={fetchSection}
            onAction={onAction}
          />
        )}
        {tab === "fraud" && <FraudTab flags={flags} onAction={onAction} />}
        {tab === "audit" && (
          <AuditTab actions={actions} fetchSection={fetchSection} />
        )}
      </div>
    </AdminShell>
  );
}
