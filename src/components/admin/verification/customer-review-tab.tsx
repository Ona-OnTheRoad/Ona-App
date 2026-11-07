"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, XCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminGate } from "@/components/admin/use-admin-gate";

interface CustomerQueueRow {
  user_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  identity_review_status?: string;
  identity_submitted_at?: string;
  gov_id_kind?: string;
  gov_id_number?: string;
  gov_id_front_url?: string;
  gov_id_back_url?: string;
  nin_verified?: boolean;
  bvn_verified?: boolean;
  nin_last4?: string;
  bvn_last4?: string;
  identity_rejection_reason?: string;
  is_active?: boolean;
}

export function CustomerReviewTab({
  onRefreshParent,
}: {
  onRefreshParent?: () => void;
}) {
  const { api } = useAdminGate();
  const [items, setItems] = useState<CustomerQueueRow[]>([]);
  const [totals, setTotals] = useState({
    total: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  });
  const [filter, setFilter] = useState<"submitted" | "approved" | "rejected" | "all">("submitted");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{
        users: CustomerQueueRow[];
        totals: {
          total: number;
          submitted: number;
          approved: number;
          rejected: number;
        };
      }>(`/api/admin/customer-review?status=${filter}`);

      if (!res.ok) {
        setError(res.message);
        return;
      }
      setItems(res.data.users || []);
      if (res.data.totals) setTotals(res.data.totals);
    } catch {
      setError("Network error loading customer review queue");
    } finally {
      setLoading(false);
    }
  }, [api, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAction(userId: string, action: "approve" | "reject") {
    setActingId(userId);
    setMsg(null);
    setError(null);
    try {
      const reason = action === "reject" ? "Document unreadable or invalid" : undefined;
      const res = await api<{ ok: boolean; message?: string }>("/api/admin/customer-review", {
        method: "POST",
        body: JSON.stringify({ action, userId, reason }),
      });
      if (res.ok) {
        setMsg(`Customer identity ${action === "approve" ? "approved" : "rejected"} successfully.`);
        await load();
        onRefreshParent?.();
      } else {
        setError(res.message || `Failed to ${action} customer`);
      }
    } catch {
      setError("Network error submitting action");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          {msg}
        </div>
      )}
      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Mini Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Pending Review</span>
          <p className="text-xl font-bold text-ona-brand mt-1">{totals.submitted}</p>
        </div>
        <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Approved</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totals.approved}</p>
        </div>
        <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Rejected</span>
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{totals.rejected}</p>
        </div>
        <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Total Submissions</span>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{totals.total}</p>
        </div>
      </div>

      {/* Filters and Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] p-3 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {(["submitted", "approved", "rejected", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer select-none",
                filter === s
                  ? "bg-ona-brand text-white shadow-xs"
                  : "bg-gray-100 dark:bg-[#18171c] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#27272a]",
              )}
            >
              {s === "submitted" ? "Pending" : s}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#18171c] text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-[#27272a] cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
        {loading && items.length === 0 ? (
          <div role="status" className="py-20 flex flex-col items-center justify-center text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-ona-brand mb-2" />
            <span>Loading customer submissions…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
            No customer ID submissions found in this status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-b border-gray-200 dark:border-[#27272a] text-gray-900 dark:text-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Gov ID</th>
                  <th className="py-3 px-4 font-semibold">NIN / BVN</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#27272a]">
                {items.map((row) => (
                  <tr key={row.user_id} className="hover:bg-gray-50/70 dark:hover:bg-[#16151a]">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{row.full_name || "Unnamed"}</div>
                      <div className="text-gray-400 text-[11px] font-mono">{row.email || row.phone || "—"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="capitalize font-medium text-gray-800 dark:text-gray-200">
                        {row.gov_id_kind || "National ID"}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {row.gov_id_front_url && (
                          <a
                            href={row.gov_id_front_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-ona-brand hover:underline font-semibold"
                          >
                            <span>Front</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {row.gov_id_back_url && (
                          <a
                            href={row.gov_id_back_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-ona-brand hover:underline font-semibold"
                          >
                            <span>Back</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {!row.gov_id_front_url && !row.gov_id_back_url && (
                          <span className="text-gray-400 text-[11px]">No images</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          row.nin_verified
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500",
                        )}>
                          NIN: {row.nin_verified ? "Verified" : row.nin_last4 ? `••${row.nin_last4}` : "None"}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          row.bvn_verified
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500",
                        )}>
                          BVN: {row.bvn_verified ? "Verified" : row.bvn_last4 ? `••${row.bvn_last4}` : "None"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize",
                        row.identity_review_status === "approved"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : row.identity_review_status === "rejected"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
                      )}>
                        {row.identity_review_status || "None"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {row.identity_review_status === "submitted" || row.identity_review_status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={actingId === row.user_id}
                            onClick={() => handleAction(row.user_id, "approve")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={actingId === row.user_id}
                            onClick={() => handleAction(row.user_id, "reject")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

