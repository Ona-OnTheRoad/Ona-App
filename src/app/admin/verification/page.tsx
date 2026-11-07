"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import {
  VerificationTabs,
  type VerificationTabKey,
} from "@/components/admin/verification/verification-tabs";
import { CustomerReviewTab } from "@/components/admin/verification/customer-review-tab";
import { ProReviewTab } from "@/components/admin/verification/pro-review-tab";
import { OverviewTab } from "@/components/admin/verification/overview-tab";
import { Loader2 } from "lucide-react";

function AdminVerificationContent() {
  const { adminName, ready, api } = useAdminGate();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") as VerificationTabKey | null;

  const [activeTab, setActiveTab] = useState<VerificationTabKey>("customer_id");
  const [counts, setCounts] = useState({
    customerPending: 0,
    proPending: 0,
  });

  useEffect(() => {
    if (tabParam && ["customer_id", "pro_id", "overview"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const loadCounts = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([
        api<{ totals: { submitted: number } }>("/api/admin/customer-review?status=submitted"),
        api<{ totals: { needs_action: number } }>("/api/admin/pro-review?filter=needs_action"),
      ]);

      setCounts({
        customerPending: c.ok ? (c.data?.totals?.submitted ?? 0) : 0,
        proPending: p.ok ? (p.data?.totals?.needs_action ?? 0) : 0,
      });
    } catch {
      // Ignore background badge count failure
    }
  }, [api]);

  useEffect(() => {
    if (ready) {
      void loadCounts();
    }
  }, [ready, loadCounts]);

  const handleTabChange = (tab: VerificationTabKey) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <AdminShell adminName={adminName}>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Verification Board
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Review customer identity documents, verify repair pro credentials, and manage vetting queues.
        </p>
      </div>

      <AdminGuideBanner pageId="verification" />

      <VerificationTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        customerPending={counts.customerPending}
        proPending={counts.proPending}
      />

      <div className="mt-4">
        {activeTab === "customer_id" && (
          <CustomerReviewTab onRefreshParent={loadCounts} />
        )}
        {activeTab === "pro_id" && (
          <ProReviewTab onRefreshParent={loadCounts} />
        )}
        {activeTab === "overview" && (
          <OverviewTab onSelectTab={handleTabChange} />
        )}
      </div>
    </AdminShell>
  );
}

export default function AdminVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121214]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-ona-brand" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Loading verification board...
            </p>
          </div>
        </div>
      }
    >
      <AdminVerificationContent />
    </Suspense>
  );
}
