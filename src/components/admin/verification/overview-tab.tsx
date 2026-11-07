"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Wrench, ShieldCheck, ArrowRight, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useAdminGate } from "@/components/admin/use-admin-gate";

interface OverviewTabProps {
  onSelectTab: (tab: "customer_id" | "pro_id") => void;
}

export function OverviewTab({ onSelectTab }: OverviewTabProps) {
  const { api } = useAdminGate();
  const [stats, setStats] = useState({
    customers: 0,
    customerPending: 0,
    pros: 0,
    proPending: 0,
    proT2: 0,
    proT4: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([
        api<{ totals: { total: number; submitted: number } }>(
          "/api/admin/customer-review?status=all",
        ),
        api<{
          totals: {
            total: number;
            needs_action: number;
            t2_pending: number;
            t4_pending: number;
          };
        }>("/api/admin/pro-review?filter=all"),
      ]);

      if (!c.ok && !p.ok) {
        setError(c.message || p.message || "Failed to load verification stats");
        return;
      }

      setStats({
        customers: c.ok ? c.data.totals.total : 0,
        customerPending: c.ok ? c.data.totals.submitted : 0,
        pros: p.ok ? p.data.totals.total : 0,
        proPending: p.ok ? p.data.totals.needs_action : 0,
        proT2: p.ok ? p.data.totals.t2_pending : 0,
        proT4: p.ok ? p.data.totals.t4_pending : 0,
      });
    } catch {
      setError("An unexpected error occurred while fetching verification data.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Verification Queue Status
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time counts of customer identity submissions and repair pro vetting queues.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-[#18181b] dark:text-gray-300 dark:border-gray-700 dark:hover:bg-[#27272a] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Customer Pending Card */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Customer ID Pending
              </span>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.customerPending}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Out of {stats.customers} total registered customers
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("customer_id")}
            className="mt-4 pt-3 border-t border-gray-100 dark:border-[#27272a] flex items-center justify-between text-xs font-medium text-ona-brand hover:underline"
          >
            <span>Review Customer IDs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pro Pending Action Card */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pros Needing Action
              </span>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.proPending}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Pending documents or ID review
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("pro_id")}
            className="mt-4 pt-3 border-t border-gray-100 dark:border-[#27272a] flex items-center justify-between text-xs font-medium text-ona-brand hover:underline"
          >
            <span>Review Pro Documents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pro Tier Breakdown Card */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pro Tier Breakdown
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">T2 ID Pending:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.proT2}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">T4 Certs Pending:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.proT4}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Total Pros:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.pros}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("pro_id")}
            className="mt-4 pt-3 border-t border-gray-100 dark:border-[#27272a] flex items-center justify-between text-xs font-medium text-ona-brand hover:underline"
          >
            <span>Manage Pro Tiers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Directory Shortcuts & Helpful Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#18181b]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Verification Protocol
          </h3>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
            <li>
              <strong>NIN / BVN Verification:</strong> Ensure name matching against legal government databases.
            </li>
            <li>
              <strong>ID Photos:</strong> Verify government photo ID (NIN Slip, Driver&apos;s License, Voters Card, International Passport). Ensure text and photos are crisp and uncropped.
            </li>
            <li>
              <strong>Pro Certifications (Tier 4):</strong> Review uploaded workshop and qualification credentials before granting Tier 4 status.
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#18181b]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Direct Directory Access
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            To view full user accounts, transactions, and profile histories, jump directly to user directories:
          </p>
          <div className="space-y-2">
            <Link
              href="/admin/motorists"
              className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-[#27272a] hover:bg-gray-50 dark:hover:bg-[#202023] text-xs font-medium text-gray-800 dark:text-gray-200"
            >
              <span>Customers Directory ({stats.customers} users)</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>
            <Link
              href="/admin/pros"
              className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-[#27272a] hover:bg-gray-50 dark:hover:bg-[#202023] text-xs font-medium text-gray-800 dark:text-gray-200"
            >
              <span>Repair Pros Directory ({stats.pros} pros)</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

