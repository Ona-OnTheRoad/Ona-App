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
import { toastError, toastSuccess } from "@/lib/toast";
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

  useEffect(() => {
    if (gate.error) toastError(gate.error);
  }, [gate.error]);

  const onAction = useCallback(
    async (action: string, body: Record<string, unknown>) => {
      try {
        const res = await fetch("/api/admin/security", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...body }),
        });
        const json = await res.json();
        if (json.ok) {
          toastSuccess(`${action} succeeded`);
          void fetchSection(tab);
          void fetchSection("overview");
        } else {
          toastError(json.error || "Action failed");
        }
      } catch {
        toastError("Network error");
      }
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
