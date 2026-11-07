/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { SecurityStatCards } from "@/components/admin/security/security-stat-cards";
import { SecuritySectionTabs } from "@/components/admin/security/security-section-tabs";
import { ContactChangesTab } from "@/components/admin/security/contact-changes-tab";
import { NameChangesTab } from "@/components/admin/security/name-changes-tab";
import { FraudTab } from "@/components/admin/security/fraud-tab";
import { AuditTab } from "@/components/admin/security/audit-tab";
import {
  rowsOf,
  sectionData,
  statsOf,
  type Tab,
} from "@/components/admin/security/types";

export default function AdminSecurityPage() {
  const gate = useAdminGate();
  // Default to contact-changes tab as shown in the Figma screenshot
  const [tab, setTab] = useState<Tab>("contact-changes");
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
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!gate.ready) return;
    // Load overview stats for the top cards, and contact-changes for default tab
    void fetchSection("overview");
    void fetchSection("contact-changes", "status=pending");
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
          void fetchSection("overview");
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

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    void fetchSection(newTab);
  };

  const overview = sectionData(data, "overview");
  const stats = statsOf(overview);
  const requests = rowsOf(sectionData(data, "contact-changes"), "requests");
  const nameRequests = rowsOf(sectionData(data, "name-changes"), "requests");
  const flags = rowsOf(sectionData(data, "fraud"), "flags");
  const actions = rowsOf(sectionData(data, "audit"), "actions");

  return (
    <AdminShell
      adminName={gate.adminName}
      title="Security"
      subtitle="Staff sessions, IP logs, and access security."
      guideKey="security"
    >
      {/* Alert / Notification Feedback */}
      {gate.error ? (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium leading-relaxed">
          {gate.error}
        </div>
      ) : null}
      {actionMsg ? (
        <div
          className={`mb-5 p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${
            actionMsg.includes("succeeded")
              ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300"
          }`}
        >
          {actionMsg}
        </div>
      ) : null}

      {/* Top 5 Metric Cards */}
      <SecurityStatCards stats={stats} />

      {/* Section Tabs Selector */}
      <SecuritySectionTabs currentTab={tab} onTabChange={handleTabChange} />

      {/* Main Tab Content */}
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
      {tab === "fraud" && (
        <FraudTab flags={flags} onAction={onAction} />
      )}
      {tab === "audit" && (
        <AuditTab actions={actions} fetchSection={fetchSection} />
      )}
    </AdminShell>
  );
}
