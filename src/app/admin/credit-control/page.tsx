"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { CreditControlStatCards } from "@/components/admin/credit-control/credit-control-stat-cards";
import { CreditControlTabs } from "@/components/admin/credit-control/credit-control-tabs";
import { ReferralsTab } from "@/components/admin/credit-control/referrals-tab";
import { CreditsTab } from "@/components/admin/credit-control/credits-tab";
import { CashoutsTab } from "@/components/admin/credit-control/cashouts-tab";
import { SettingsTab } from "@/components/admin/credit-control/settings-tab";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  rowsOf,
  sectionData,
  statsOf,
  type Tab,
} from "@/components/admin/credit-control/types";

export default function AdminCreditControlPage() {
  const gate = useAdminGate();
  const [tab, setTab] = useState<Tab>("referrals");
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
    // Load overview stats for the top cards, and initial tab
    void fetchSection("overview");
    void fetchSection("referrals");
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
  const refEvents = rowsOf(sectionData(data, "referrals"), "events");
  const txs = rowsOf(sectionData(data, "credits"), "transactions");
  const cashoutList = rowsOf(sectionData(data, "cashouts"), "requests");
  const settings = rowsOf(sectionData(data, "settings"), "settings");

  return (
    <AdminShell
      adminName={gate.adminName}
      title="Credit Control"
      subtitle="User balances, dispute credits, and fee overrides."
      guideKey="credit-control"
    >
      {/* Top 5 Metric Cards */}
      <CreditControlStatCards stats={stats} />

      {/* Section Tabs Selector */}
      <CreditControlTabs currentTab={tab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      {tab === "referrals" && (
        <ReferralsTab refEvents={refEvents} onAction={onAction} />
      )}
      {tab === "credits" && <CreditsTab txs={txs} />}
      {tab === "cashouts" && (
        <CashoutsTab cashoutList={cashoutList} onAction={onAction} />
      )}
      {tab === "settings" && (
        <SettingsTab settings={settings} onAction={onAction} />
      )}
    </AdminShell>
  );
}
