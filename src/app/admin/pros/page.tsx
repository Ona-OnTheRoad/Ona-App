"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toastError } from "@/lib/toast";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { ProsStatCards } from "@/components/admin/pros/pros-stat-cards";
import { ProsTable, type ProItem } from "@/components/admin/pros/pros-table";
import type { AdminUsersResult } from "@/lib/server/identity/admin-users";

type ProRow = Extract<AdminUsersResult, { ok: true }>["users"][number];

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
  const [loadFailed, setLoadFailed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const usersRes = await api<{ users: ProRow[] }>(
        "/api/admin/users?role=repair_pro",
        { cache: "no-store" },
      );

      if (usersRes.ok && usersRes.data?.users) {
        const mappedPros: ProItem[] = usersRes.data.users.map((u) => ({
          id: u.id,
          full_name: u.full_name || "Unnamed pro",
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

        setCounts({
          totalPros: mappedPros.length,
          needsAction: mappedPros.filter(
            (p) => p.status.toLowerCase() === "pending",
          ).length,
          t2Pending: mappedPros.filter((p) => !p.verified).length,
          t4Pending: 0,
        });
      } else {
        setPros([]);
        if (!usersRes.ok) {
          setLoadFailed(true);
          toastError(usersRes.message || "Failed to load repair pros");
        }
      }
    } catch {
      setLoadFailed(true);
      toastError("Failed to load repair pros from network");
      setPros([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const failure = Boolean(gateError) || loadFailed;

  useEffect(() => {
    if (gateError) toastError(gateError);
  }, [gateError]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(pros.length / ITEMS_PER_PAGE));
  const paginatedPros = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return pros.slice(start, start + ITEMS_PER_PAGE);
  }, [pros, currentPage]);

  return (
    <AdminShell
      adminName={adminName}
      adminRole={adminRole}
      title="Repair Pros"
      subtitle="Artisans, mechanics, and trade specialties."
      guideKey="pros"
    >
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
        loading={!ready || loading}
        failure={Boolean(failure)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRefresh={() => void load()}
      />
    </AdminShell>
  );
}
