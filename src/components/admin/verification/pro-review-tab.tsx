"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";
import { useAdminGate } from "@/components/admin/use-admin-gate";

interface ProQueueRow {
  user_id: string;
  full_name?: string;
  business_name?: string;
  email?: string;
  phone?: string;
  primary_service?: string;
  status?: string;
  verified?: boolean;
  gov_id_review_status?: string;
  docs_status?: string;
  gov_id_kind?: string;
  gov_id_front_url?: string;
  gov_id_back_url?: string;
  certification_file_url?: string;
  certification_file_name?: string;
  nin_verified?: boolean;
  bvn_verified?: boolean;
  rejection_reason?: string;
  levels?: {
    t2_id?: {
      front_url?: string | null;
      back_url?: string | null;
      review_status?: string | null;
      gov_id_kind?: string | null;
    };
    t4_docs?: {
      file_url?: string | null;
      file_name?: string | null;
      docs_status?: string | null;
    };
  };
}

export function ProReviewTab({
  onRefreshParent,
}: {
  onRefreshParent?: () => void;
}) {
  const { api } = useAdminGate();
  const [items, setItems] = useState<ProQueueRow[]>([]);
  const [totals, setTotals] = useState({
    total: 0,
    needs_action: 0,
    t2_pending: 0,
    t4_pending: 0,
  });
  const [filter, setFilter] = useState<"needs_action" | "t2_pending" | "t4_pending" | "all">("needs_action");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{
        pros: ProQueueRow[];
        totals: {
          total: number;
          needs_action: number;
          t2_pending: number;
          t4_pending: number;
        };
      }>(`/api/admin/pro-review?filter=${filter}`);

      if (!res.ok) {
        toastError(res.message);
        return;
      }
      setItems(res.data.pros || []);
      if (res.data.totals) setTotals(res.data.totals);
    } catch {
      toastError("Network error loading repair pro review queue");
    } finally {
      setLoading(false);
    }
  }, [api, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAction(userId: string, action: "approve" | "reject") {
    setActingId(userId);
    try {
      const reason = action === "reject" ? "Submitted documents do not meet vetting criteria" : undefined;
      const res = await api<{ ok: boolean; message?: string }>("/api/admin/pro-review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "approve" ? "pro_t2_approve" : "pro_t2_reject",
          userId,
          reason,
        }),
      });
      if (res.ok) {
        toastSuccess(`Repair pro ${action === "approve" ? "approved" : "rejected"} successfully.`);
        await load();
        onRefreshParent?.();
      } else {
        toastError(res.message || `Failed to ${action} repair pro`);
      }
    } catch {
      toastError("Network error submitting action");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Mini Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Needs Action</span>
          <p className="text-xl font-bold text-ona-brand mt-1">{totals.needs_action}</p>
        </div>
        <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase">T2 ID Pending</span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totals.t2_pending}</p>
        </div>
        <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase">T4 Skills Pending</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{totals.t4_pending}</p>
        </div>
        <div className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Total Pros</span>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{totals.total}</p>
        </div>
      </div>

      {/* Filters and Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] p-3 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {(["needs_action", "t2_pending", "t4_pending", "all"] as const).map((s) => (
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
              {s === "needs_action" ? "Needs Action" : s === "t2_pending" ? "ID Review" : s === "t4_pending" ? "Skill Docs" : "All Pros"}
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
            <span>Loading repair pro submissions…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
            No repair pros requiring review under this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-b border-gray-200 dark:border-[#27272a] text-gray-900 dark:text-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Pro / Business</th>
                  <th className="py-3 px-4 font-semibold">Trade</th>
                  <th className="py-3 px-4 font-semibold">Gov ID</th>
                  <th className="py-3 px-4 font-semibold">Certificates</th>
                  <th className="py-3 px-4 font-semibold">Account Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#27272a]">
                {items.map((row) => (
                  <tr key={row.user_id} className="hover:bg-gray-50/70 dark:hover:bg-[#16151a]">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {row.full_name || row.business_name || "Unnamed Pro"}
                      </div>
                      <div className="text-gray-400 text-[11px] font-mono">{row.email || row.phone || "—"}</div>
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-gray-800 dark:text-gray-200">
                      {row.primary_service || "—"}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const frontUrl = row.gov_id_front_url || row.levels?.t2_id?.front_url;
                        const backUrl = row.gov_id_back_url || row.levels?.t2_id?.back_url;
                        const reviewStatus = row.gov_id_review_status || row.levels?.t2_id?.review_status;
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              {frontUrl && (
                                <a
                                  href={frontUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-ona-brand hover:underline font-semibold"
                                >
                                  <span>Front</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              {backUrl && (
                                <a
                                  href={backUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-ona-brand hover:underline font-semibold"
                                >
                                  <span>Back</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              {!frontUrl && !backUrl && (
                                <span className="text-gray-400 text-[11px]">No ID doc</span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {reviewStatus || "not submitted"}
                            </div>
                          </>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const certUrl = row.certification_file_url || row.levels?.t4_docs?.file_url;
                        const certName = row.certification_file_name || row.levels?.t4_docs?.file_name;
                        const docsStatus = row.docs_status || row.levels?.t4_docs?.docs_status;
                        return (
                          <>
                            {certUrl ? (
                              <a
                                href={certUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                              >
                                <span>{certName || "View Cert"}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-gray-400 text-[11px]">No cert</span>
                            )}
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {docsStatus || "none"}
                            </div>
                          </>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize",
                        row.status === "approved"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : row.status === "rejected"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
                      )}>
                        {row.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {row.status !== "approved" ? (
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
                        <span className="text-gray-400 text-[11px]">Approved</span>
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

