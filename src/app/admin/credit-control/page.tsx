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
    // Load overview stats for the top cards, and initial tab
    void fetchSection("overview");
    void fetchSection("referrals");
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
