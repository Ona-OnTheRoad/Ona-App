"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { one, type Detail } from "@/components/admin/motorist-detail/types";
import { CustomerStatCards } from "@/components/admin/motorist-detail/customer-stat-cards";
import {
  CustomerTabs,
  type CustomerDetailTab,
} from "@/components/admin/motorist-detail/customer-tabs";
import { ProfileVehiclesTab } from "@/components/admin/motorist-detail/profile-vehicles-tab";
import { CustomerJobsTab } from "@/components/admin/motorist-detail/customer-jobs-tab";
import { CustomerBookingsTab } from "@/components/admin/motorist-detail/customer-bookings-tab";
import { CustomerPaymentsTab } from "@/components/admin/motorist-detail/customer-payments-tab";
import { CustomerSyncTab } from "@/components/admin/motorist-detail/customer-sync-tab";
import { CustomerDetailSkeleton } from "@/components/admin/motorist-detail/customer-detail-skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AdminMotoristDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { adminName, ready, api, router } = useAdminGate();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentTab, setCurrentTab] = useState<CustomerDetailTab>("profile");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api<Detail>(`/api/admin/users/${id}`);
      if (!res.ok) {
        setError(res.message || "Failed to load customer profile");
        setData(null);
        return;
      }
      setData(res.data);
      setError(null);
    } catch {
      setError("Failed to load customer profile from network");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  async function toggleActive() {
    if (!data?.user) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await api(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !data.user.is_active }),
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setMsg(data.user.is_active ? "Customer deactivated" : "Customer activated");
      await load();
    } catch {
      setError("Failed to update customer status");
    } finally {
      setBusy(false);
    }
  }

  async function hardDelete() {
    if (
      !window.confirm(
        `Hard-delete ${data?.user.full_name || "this customer"} permanently? This action cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await api(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.replace("/admin/motorists");
    } catch {
      setError("Failed to delete customer");
    } finally {
      setBusy(false);
    }
  }

  async function reSync() {
    if (!id) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await api(`/api/admin/users/${id}/sync`, { method: "POST" });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setMsg("Identity sync completed successfully");
      await load();
    } catch {
      setError("Identity sync re-run failed");
    } finally {
      setBusy(false);
    }
  }

  // Loading State - Matches Dashboard & Dispatch Tabs
  if (!ready || loading) {
    return (
      <AdminShell
        adminName={adminName}
        title="Loading customer..."
        subtitle="Single customer record: profile, identity, vehicle, bank, and job history from the live Ona database."
        guideKey="customer-detail"
      >
        <CustomerDetailSkeleton />
      </AdminShell>
    );
  }

  // Error State or User Not Found
  if (error || !data || !data.user) {
    return (
      <AdminShell
        adminName={adminName}
        title="Customer Record"
        subtitle="Single customer record: profile, identity, vehicle, bank, and job history from the live Ona database."
        guideKey="customer-detail"
      >
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-4 flex items-center gap-1.5 select-none">
          <Link
            href="/admin/motorists"
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Customers
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 dark:text-gray-200 font-medium">
            Customer profile
          </span>
        </div>

        <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {error || "Customer Not Found"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            The requested customer profile could not be retrieved from the server.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => void load()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <Link
              href="/admin/motorists"
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#27272a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#16151a] text-xs font-semibold transition-colors"
            >
              Back to Customers
            </Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  const u = data.user;
  const mot = one(u.motorist_profiles);

  return (
    <AdminShell
      adminName={adminName}
      title={u.full_name || "Unnamed Customer"}
      subtitle="Single customer record: profile, identity, vehicle, bank, and job history from the live Ona database."
      guideKey="customer-detail"
    >
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-4 flex items-center gap-1.5 select-none">
        <Link
          href="/admin/motorists"
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Customers
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 dark:text-gray-200 font-medium">
          Customer profile
        </span>
      </div>

      {/* Header action buttons row */}
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5 mb-6 mt-2 sm:mt-0 sm:-mt-14">
        <button
          type="button"
          disabled={busy}
          onClick={toggleActive}
          className="px-4 py-2 rounded-xl bg-[#d90429] hover:bg-[#b00320] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
        >
          {u.is_active ? "Deactivate" : "Activate"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={hardDelete}
          className="px-4 py-2 rounded-xl border border-[#d90429] text-[#d90429] hover:bg-[#d90429]/10 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
        >
          Delete permanently
        </button>
      </div>

      {/* Feedback Messages */}
      {msg ? (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium leading-relaxed">
          {msg}
        </div>
      ) : null}
      {error ? (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium leading-relaxed">
          {error}
        </div>
      ) : null}

      {/* 4 Summary Stat Cards */}
      <CustomerStatCards
        isActive={Boolean(u.is_active)}
        jobsCount={data.jobs?.length ?? 0}
        bookingsCount={data.bookings?.length ?? 0}
        paymentsCount={data.payments?.length ?? 0}
      />

      {/* Detail Segmented Tabs */}
      <CustomerTabs currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Tab Panels */}
      {currentTab === "profile" && <ProfileVehiclesTab u={u} mot={mot} />}
      {currentTab === "jobs" && <CustomerJobsTab jobs={data.jobs || []} />}
      {currentTab === "bookings" && (
        <CustomerBookingsTab bookings={data.bookings || []} />
      )}
      {currentTab === "payments" && (
        <CustomerPaymentsTab payments={data.payments || []} />
      )}
      {currentTab === "sync" && (
        <CustomerSyncTab
          data={data}
          busy={busy}
          onReSync={() => void reSync()}
        />
      )}
    </AdminShell>
  );
}
