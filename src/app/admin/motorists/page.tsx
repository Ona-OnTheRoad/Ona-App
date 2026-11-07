"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toastError } from "@/lib/toast";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { CustomersStatCards } from "@/components/admin/customers/customers-stat-cards";
import { CustomersTable, type CustomerItem } from "@/components/admin/customers/customers-table";
import type { AdminUsersResult } from "@/lib/server/identity/admin-users";

type MotoristRow = Extract<AdminUsersResult, { ok: true }>["users"][number];

const ITEMS_PER_PAGE = 10;

export default function AdminCustomersHubPage() {
  const { adminName, adminRole, ready, api, error: gateError } = useAdminGate();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await api<{ users: MotoristRow[] }>(
        "/api/admin/users?role=motorist",
        { cache: "no-store" },
      );
      if (res.ok && res.data?.users) {
        setCustomers(
          res.data.users.map((u) => ({
            id: u.id,
            full_name: u.full_name || "Unnamed motorist",
            email: u.email || "",
            phone: u.phone,
            location: [u.area, u.city].filter(Boolean).join(", ") || "—",
            is_active: Boolean(u.is_active),
          })),
        );
      } else {
        setCustomers([]);
        if (!res.ok) {
          setLoadFailed(true);
          toastError(res.message || "Failed to load customers");
        }
      }
    } catch {
      setLoadFailed(true);
      toastError("Failed to load customers from network");
      setCustomers([]);
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
  const totalPages = Math.max(1, Math.ceil(customers.length / ITEMS_PER_PAGE));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return customers.slice(start, start + ITEMS_PER_PAGE);
  }, [customers, currentPage]);

  const t2PendingCount = useMemo(() => {
    return customers.filter((c) => !c.is_active).length;
  }, [customers]);

  return (
    <AdminShell
      adminName={adminName}
      adminRole={adminRole}
      title="Customers"
      subtitle="Consumer accounts: verification, vehicle profiles, and booking history."
      guideKey="customers"
    >
      {/* Metric Stat Cards */}
      <CustomersStatCards
        totalCustomers={customers.length}
        t2Pending={t2PendingCount}
      />

      {/* Customers Table */}
      <CustomersTable
        customers={paginatedCustomers}
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
