"use client";

import { toastError, toastSuccess } from "@/lib/toast";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type DeletionRequest = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  deletion_status: "pending_deletion" | "restored";
  deletion_scheduled_at: string | null;
  deleted_at: string | null;
  self_reactivated_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminDeletionRequestsPage() {
  const { adminName } = useAdminGate();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deletion-requests");
      const json = await res.json();
      if (json.ok) setRequests(json.data.requests ?? []);
      else toastError(json.error?.message || "Failed to load deletion requests");
    } catch {
      toastError("Network error loading deletion requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (userId: string, action: "force_delete" | "restore") => {
    setActioning(userId);
    try {
      const res = await fetch("/api/admin/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const json = await res.json();
      if (json.ok) {
        toastSuccess(action === "restore" ? "Account restored." : "Account deleted.");
        void load();
      } else {
        toastError(json.error?.message || "Action failed");
      }
    } catch {
      toastError("Network error submitting action");
    } finally {
      setActioning(null);
    }
  };

  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    setNowMs(Date.now());
  }, [requests]);

  const daysLeft = (scheduled: string | null) => {
    if (!scheduled || !nowMs) return null;
    const diff = new Date(scheduled).getTime() - nowMs;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <AdminShell
      adminName={adminName}
      title="Deletion"
      subtitle="NDPR and account erasure requests."
      guideKey="deletion"
    >
      {loading ? (
        <div className="w-full bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-2xl min-h-[520px] flex items-center justify-center p-12 text-center shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-ona-brand" />
        </div>
      ) : requests.length === 0 ? (
        /* Empty State matching Figma screenshot */
        <div className="w-full bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-2xl min-h-[520px] lg:min-h-[600px] flex flex-col items-center justify-center p-6 sm:p-12 text-center shadow-xs">
          <div className="relative w-48 h-40 sm:w-56 sm:h-48">
            <Image
              src="/images/shop-orders-icon.png"
              alt="Shop management dashboard"
              fill
              sizes="224px"
              className="object-contain"
              priority
            />
          </div>

          <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-6">
            Shop management dashboard.
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 max-w-sm">
            Use the admin API routes for shop operations.
          </p>
        </div>
      ) : (
        /* Table View when active requests exist */
        <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
          <div className="px-6 pt-5 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
              Deletion Requests
            </h2>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px] border-collapse">
              <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
                <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                  <th className="py-3 pl-6 pr-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Days left</th>
                  <th className="py-3 px-4 font-semibold">Scheduled</th>
                  <th className="py-3 pl-4 pr-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                  >
                    <td className="py-3.5 pl-6 pr-4 font-medium text-gray-900 dark:text-white">
                      {r.full_name || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      {r.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize",
                          r.deletion_status === "pending_deletion"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
                        )}
                      >
                        {r.deletion_status === "pending_deletion"
                          ? "Pending"
                          : "Restored"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-700 dark:text-gray-300">
                      {r.deletion_status === "pending_deletion"
                        ? `${daysLeft(r.deletion_scheduled_at)}d`
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 text-[11px]">
                      {r.deletion_scheduled_at
                        ? new Date(r.deletion_scheduled_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-right">
                      {r.deletion_status === "pending_deletion" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={actioning === r.id}
                            onClick={() => void act(r.id, "force_delete")}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                          >
                            {actioning === r.id ? "…" : "Delete now"}
                          </button>
                          <button
                            type="button"
                            disabled={actioning === r.id}
                            onClick={() => void act(r.id, "restore")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                          >
                            {actioning === r.id ? "…" : "Restore"}
                          </button>
                        </div>
                      )}
                      {r.deletion_status === "restored" && (
                        <span className="text-gray-400 dark:text-gray-500 text-[11px]">
                          Restored
                          {r.self_reactivated_at
                            ? ` ${new Date(r.self_reactivated_at).toLocaleDateString()}`
                            : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
