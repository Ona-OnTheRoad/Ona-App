"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { ProsStatCards } from "@/components/admin/pros/pros-stat-cards";
import { ProsTable, type ProItem } from "@/components/admin/pros/pros-table";
import type { AdminUsersResult } from "@/lib/server/identity/admin-users";
import { Loader2 } from "lucide-react";

type ProRow = Extract<AdminUsersResult, { ok: true }>["users"][number];

interface PendingCountsResponse {
  customers: { pending: number; noId: number; totalOpen: number };
  pros: {
    idPending: number;
    docsPending: number;
    accountPending: number;
    totalOpen: number;
  };
}

const ITEMS_PER_PAGE = 10;

export default function AdminProsHubPage() {
  const { adminName, adminRole, ready, api, error: gateError } = useAdminGate();
  const [pros, setPros] = useState<ProItem[]>([]);
  const [counts, setCounts] = useState<{
    totalPros: number;
    needsAction: number;
    t2Pending: number;
    t4Pending: number;
  }>({
    totalPros: 0,
    needsAction: 0,
    t2Pending: 0,
    t4Pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, countsRes] = await Promise.all([
        api<{ users: ProRow[] }>("/api/admin/users?role=repair_pro", {
          cache: "no-store",
        }),
        api<PendingCountsResponse>("/api/admin/pending-counts", {
          cache: "no-store",
        }),
      ]);

      if (usersRes.ok && usersRes.data?.users) {
        const mappedPros: ProItem[] = usersRes.data.users.map((u) => ({
          id: u.id,
          full_name: u.full_name || "Unnamed Pro",
          email: u.email || "",
          phone: u.phone,
          location: [u.area, u.city].filter(Boolean).join(", ") || "—",
          trade: u.repair_pro_profiles?.primary_service || "—",
          status: !u.is_active
            ? "Inactive"
            : u.repair_pro_profiles?.status || "—",
          verified: Boolean(u.repair_pro_profiles?.verified),
        }));
        setPros(mappedPros);

        const pendingData = countsRes.ok ? countsRes.data : null;
        setCounts({
          totalPros: mappedPros.length,
          needsAction:
            pendingData?.pros?.totalOpen ??
            mappedPros.filter((p) => p.status.toLowerCase() === "pending")
              .length,
          t2Pending:
            pendingData?.pros?.idPending ??
            mappedPros.filter((p) => !p.verified).length,
          t4Pending: pendingData?.pros?.docsPending ?? 0,
        });
      } else {
        setPros([]);
        if (!usersRes.ok) setError(usersRes.message || "Failed to load repair pros");
      }
    } catch {
      setError("Failed to load repair pros from network");
      setPros([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const failure = gateError || error;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(pros.length / ITEMS_PER_PAGE));
  const paginatedPros = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return pros.slice(start, start + ITEMS_PER_PAGE);
  }, [pros, currentPage]);

  // Loading State - Matches Dashboard, Dispatch, and Customers
  if (!ready || (loading && pros.length === 0)) {
    return (
      <AdminShell
        adminName={adminName}
        title="Repair Pros"
        subtitle="Artisans, mechanics, and trade specialties."
        guideKey="pros"
      >
        <div className="flex items-center justify-center min-h-[50vh] text-gray-400 dark:text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-ona-brand" />
          Loading repair pros…
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      adminName={adminName}
      title="Repair Pros"
      subtitle="Artisans, mechanics, and trade specialties."
      guideKey="pros"
    >
      {failure ? (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium leading-relaxed">
          {failure}
        </div>
      ) : null}

      {/* 4 Metric Stat Cards */}
      <ProsStatCards
        totalPros={counts.totalPros}
        needsAction={counts.needsAction}
        t2Pending={counts.t2Pending}
        t4Pending={counts.t4Pending}
      />

      {/* Repair Pros Table */}
      <ProsTable
        pros={paginatedPros}
        totalCount={counts.totalPros}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRefresh={() => void load()}
      />
    </AdminShell>
  );
}
