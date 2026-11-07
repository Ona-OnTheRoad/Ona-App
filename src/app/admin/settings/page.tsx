"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SensitivePageGate } from "@/components/admin/sensitive-page-gate";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { withSensitivePassword } from "@/components/admin/sensitive-unlock";
import {
  SettingsTabs,
  type SettingsTabKey,
} from "@/components/admin/settings/settings-tabs";
import { SystemHealthTab } from "@/components/admin/settings/system-health-tab";
import { StaffLevelsTab } from "@/components/admin/settings/staff-levels-tab";
import { AppSettingsTab } from "@/components/admin/settings/app-settings-tab";
import { FeatureFlagsTab } from "@/components/admin/settings/feature-flags-tab";
import { ServicesCatalogTab } from "@/components/admin/settings/services-catalog-tab";
import { MapMatchingTab } from "@/components/admin/settings/map-matching-tab";
import { ContentMenusTab } from "@/components/admin/settings/content-menus-tab";
import type { AppConfig } from "@/lib/app-config";
import type { HealthSnapshot } from "@/types/health";
import type { StaffRow } from "@/components/admin/staff/levels";
import type {
  CalloutPolicyAdmin,
  CalloutTradeAdmin,
} from "@/components/admin/matching/types";
import { Loader2 } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toast";

function AdminSettingsContent() {
  const { adminName, adminRole, ready, api } = useAdminGate();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") as SettingsTabKey | null;
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("health");

  useEffect(() => {
    if (
      tabParam &&
      [
        "health",
        "staff",
        "app",
        "features",
        "services",
        "matching",
        "content",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Config data (App, Features, Services, Matching, Verification, Content)
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [problemsText, setProblemsText] = useState("");

  // Health data
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [runningHealth, setRunningHealth] = useState(false);

  // Staff data
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [assignable, setAssignable] = useState<string[]>([]);
  const [actorRole, setActorRole] = useState<string | null>(null);
  const [busyStaffId, setBusyStaffId] = useState<string | null>(null);

  // Callout policy
  const [calloutPolicy, setCalloutPolicy] = useState<CalloutPolicyAdmin | null>(null);
  const [calloutTrades, setCalloutTrades] = useState<CalloutTradeAdmin[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load health snapshot
  const loadHealth = useCallback(
    async (manual = false) => {
      if (manual) setRunningHealth(true);
      const res = await api<{ snapshot: HealthSnapshot }>("/api/health");
      if (manual) setRunningHealth(false);
      if (res.ok) {
        setSnapshot(res.data.snapshot);
      }
    },
    [api],
  );

  // Load staff
  const loadStaff = useCallback(async () => {
    const res = await api<{
      staff: StaffRow[];
      assignable: string[];
      actorRole?: string;
    }>("/api/admin/staff");
    if (res.ok) {
      setStaff(res.data.staff || []);
      setAssignable(res.data.assignable || []);
      setActorRole(res.data.actorRole || null);
    }
  }, [api]);

  // Load config & callout
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [cfgRes, calloutRes] = await Promise.all([
      api<{ config: AppConfig }>("/api/admin/settings"),
      api<{ policy: CalloutPolicyAdmin; trades: CalloutTradeAdmin[] }>("/api/admin/callout"),
    ]);

    if (!cfgRes.ok) {
      toastError(cfgRes.message);
      setLoading(false);
      return;
    }

    const c = cfgRes.data.config;
    setConfig(c);
    setProblemsText((c.content.requestProblems ?? []).join("\n"));

    if (calloutRes.ok) {
      setCalloutPolicy(calloutRes.data.policy);
      setCalloutTrades(calloutRes.data.trades);
    }

    await Promise.all([loadHealth(false), loadStaff()]);
    setLoading(false);
  }, [api, loadHealth, loadStaff]);

  useEffect(() => {
    if (!ready) return;
    void loadAll();
  }, [ready, loadAll]);

  // Save App Settings
  async function saveAppSettings() {
    if (!config) return;
    await withSensitivePassword(
      {
        title: "Password required",
        detail: "Enter password to save system settings.",
      },
      async () => {
        setSaving(true);
        try {
          const res = await api<{ config: AppConfig }>("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "app", value: config.app }),
          });
          if (!res.ok) {
            toastError(res.message);
            return;
          }
          setConfig(res.data.config);
          toastSuccess("App settings saved frontend will pick them up.");
        } finally {
          setSaving(false);
        }
      },
    );
  }

  // Save Feature Flags
  async function saveFeatureFlags() {
    if (!config) return;
    await withSensitivePassword(
      {
        title: "Password required",
        detail: "Enter password to save feature flags.",
      },
      async () => {
        setSaving(true);
        try {
          const res = await api<{ config: AppConfig }>("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "features", value: config.features }),
          });
          if (!res.ok) {
            toastError(res.message);
            return;
          }
          setConfig(res.data.config);
          toastSuccess("Feature flags saved successfully.");
        } finally {
          setSaving(false);
        }
      },
    );
  }

  // Save Services Catalog
  async function saveServicesCatalog() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await api<{ config: AppConfig }>("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "services", value: config.services }),
      });
      if (!res.ok) {
        toastError(res.message);
        return;
      }
      setConfig(res.data.config);
      toastSuccess("Service catalog saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  // Save Map & Matching Rules
  async function saveMatchingRules() {
    if (!config) return;
    setSaving(true);
    try {
      const [resM, resV] = await Promise.all([
        api<{ config: AppConfig }>("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "matching", value: config.matching }),
        }),
        api<{ config: AppConfig }>("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "verification", value: config.verification }),
        }),
      ]);

      if (!resM.ok) {
        toastError(resM.message);
        return;
      }
      if (!resV.ok) {
        toastError(resV.message);
        return;
      }
      setConfig(resV.data.config);

      if (calloutPolicy) {
        await api("/api/admin/callout", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policy: calloutPolicy,
            trades: calloutTrades,
            reason: "Admin settings save",
          }),
        });
      }

      toastSuccess("Matching, verification, and call-out rules saved.");
    } finally {
      setSaving(false);
    }
  }

  // Save Content & Menus
  async function saveContent() {
    if (!config) return;
    setSaving(true);
    const requestProblems = problemsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const value = { ...config.content, requestProblems };

    try {
      const res = await api<{ config: AppConfig }>("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "content", value }),
      });
      if (!res.ok) {
        toastError(res.message);
        return;
      }
      setConfig(res.data.config);
      setProblemsText(res.data.config.content.requestProblems.join("\n"));
      toastSuccess("Content saved request flow & home copy updated.");
    } finally {
      setSaving(false);
    }
  }

  // Health toggle resolved
  async function handleToggleResolved(id: string, resolved: boolean) {
    const res = await api("/api/admin/health/logs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved }),
    });
    if (!res.ok) {
      toastError(res.message);
      return;
    }
    setSnapshot((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        issues: prev.issues.map((i) => (i.id === id ? { ...i, resolved } : i)),
      };
    });
  }

  // Staff set level
  async function handleSetLevel(userId: string, adminRoleNext: string) {
    setBusyStaffId(userId);
    await withSensitivePassword(
      {
        title: "Confirm staff level change",
        detail: "Temporary access code required to change access levels.",
      },
      async () => {
        const res = await api<{ roleLabel: string }>("/api/admin/staff", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, adminRole: adminRoleNext }),
        });
        if (!res.ok) {
          toastError(res.message);
          return;
        }
        toastSuccess(`Access level updated → ${res.data.roleLabel}`);
        await loadStaff();
      },
    );
    setBusyStaffId(null);
  }

  // Services toggle trade
  function handleToggleTrade(tradeId: string) {
    if (!config) return;
    const current = config.services.enabled;
    const next = current.includes(tradeId)
      ? current.filter((x) => x !== tradeId)
      : [...current, tradeId];
    setConfig({
      ...config,
      services: { ...config.services, enabled: next },
    });
  }

  return (
    <AdminShell
      adminName={adminName}
      adminRole={adminRole}
      title="System settings"
      subtitle="Tier 1/2 KYC, NIN, and vetting queue."
      guideKey="settings"
    >
      <SensitivePageGate pageName="System settings">
        <div className="w-full pb-16">
        {/* Tabs Bar */}
        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Loading gate */}
        {!ready || loading ? (
          <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-ona-brand mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Loading system settings...
            </p>
          </div>
        ) : (
          <div>
            {activeTab === "health" && (
              <SystemHealthTab
                snapshot={snapshot}
                loading={loading}
                running={runningHealth}
                onRunCheck={() => loadHealth(true)}
                onToggleResolved={handleToggleResolved}
              />
            )}

            {activeTab === "staff" && (
              <StaffLevelsTab
                staff={staff}
                assignable={assignable}
                actorRole={actorRole}
                busyId={busyStaffId}
                onSetLevel={handleSetLevel}
              />
            )}

            {activeTab === "app" && config && (
              <AppSettingsTab
                app={config.app}
                onChange={(app) => setConfig({ ...config, app })}
                onSave={saveAppSettings}
                saving={saving}
              />
            )}

            {activeTab === "features" && config && (
              <FeatureFlagsTab
                features={config.features}
                onChange={(features) => setConfig({ ...config, features })}
                onSave={saveFeatureFlags}
                saving={saving}
              />
            )}

            {activeTab === "services" && config && (
              <ServicesCatalogTab
                services={config.services}
                onToggle={handleToggleTrade}
                onSave={saveServicesCatalog}
                saving={saving}
              />
            )}

            {activeTab === "matching" && config && (
              <MapMatchingTab
                matching={config.matching}
                verification={config.verification}
                calloutPolicy={calloutPolicy}
                calloutTrades={calloutTrades}
                maintenanceMode={Boolean(config.app.maintenanceMode)}
                onMaintenanceModeChange={(val) =>
                  setConfig({ ...config, app: { ...config.app, maintenanceMode: val } })
                }
                onMatchingChange={(matching) => setConfig({ ...config, matching })}
                onVerificationChange={(verification) => setConfig({ ...config, verification })}
                onCalloutPolicyChange={setCalloutPolicy}
                onCalloutTradesChange={setCalloutTrades}
                onSave={saveMatchingRules}
                saving={saving}
              />
            )}

            {activeTab === "content" && config && (
              <ContentMenusTab
                content={config.content}
                problemsText={problemsText}
                onContentChange={(content) => setConfig({ ...config, content })}
                onProblemsTextChange={setProblemsText}
                onSave={saveContent}
                saving={saving}
              />
            )}
          </div>
        )}
        </div>
      </SensitivePageGate>
    </AdminShell>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-ona-brand" />
        </div>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}
