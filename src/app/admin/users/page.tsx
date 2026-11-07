"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { toastError, toastSuccess } from "@/lib/toast";
import { UsersStatCards } from "@/components/admin/users/users-stat-cards";
import { UsersTable, type UserItem } from "@/components/admin/users/users-table";
import type { AdminUsersResult } from "@/lib/server/identity/admin-users";
import { Loader2 } from "lucide-react";

type RawUserRow = Extract<AdminUsersResult, { ok: true }>["users"][number];

interface PendingCountsResponse {
  customers: { total: number; pending: number; noId: number; totalOpen: number };
  pros: {
    total: number;
    idPending: number;
    docsPending: number;
    accountPending: number;
    totalOpen: number;
  };
}

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const { adminName, adminRole, ready, api, error: gateError } = useAdminGate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [counts, setCounts] = useState({
    customersCount: 0,
    customerT2Pending: 0,
    prosCount: 0,
    proNeedsAction: 0,
    proT2Pending: 0,
    proT4Pending: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (roleFilter) params.set("role", roleFilter);

      const [usersRes, countsRes] = await Promise.all([
        api<{ users: RawUserRow[] }>(`/api/admin/users?${params}`, {
          cache: "no-store",
        }),
        api<PendingCountsResponse>("/api/admin/pending-counts", {
          cache: "no-store",
        }),
      ]);

      if (usersRes.ok && usersRes.data?.users) {
        const mappedUsers: UserItem[] = usersRes.data.users.map((u) => {
          const motRaw = u.motorist_profiles;
          const mot = Array.isArray(motRaw) ? motRaw[0] : motRaw;
          const proRaw = u.repair_pro_profiles;
          const pro = Array.isArray(proRaw) ? proRaw[0] : proRaw;

          let extra = "—";
          if (u.role === "motorist") {
            const vehicle = [mot?.vehicle_make, mot?.vehicle_model, mot?.vehicle_year]
              .filter(Boolean)
              .join(" ");
            extra = vehicle || pro?.primary_service || "Customer";
          } else if (u.role === "repair_pro") {
            extra = pro?.primary_service || "Repair Pro";
          } else {
            extra = "Admin";
          }

          const isPending =
            Boolean(pro && pro.status === "pending") ||
            Boolean(mot && mot.identity_review_status === "submitted");

          const statusText = !u.is_active
            ? "Inactive"
            : isPending
            ? "Pending"
            : "Active";

          return {
            id: u.id,
            role: (u.role || "motorist") as "admin" | "motorist" | "repair_pro",
            full_name: u.full_name || "Unnamed user",
            email: u.email,
            phone: u.phone,
            city: u.city,
            area: u.area,
            is_active: Boolean(u.is_active),
            created_at: u.created_at,
            extra,
            statusText,
            isPending,
            hasMotoristProfile: Boolean(mot),
          };
        });
        setUsers(mappedUsers);

        if (countsRes.ok && countsRes.data) {
          const d = countsRes.data;
          setCounts({
            customersCount: d.customers?.total ?? 0,
            customerT2Pending: d.customers?.pending ?? 0,
            prosCount: d.pros?.total ?? 0,
            proNeedsAction: d.pros?.totalOpen ?? 0,
            proT2Pending: d.pros?.idPending ?? 0,
            proT4Pending: d.pros?.docsPending ?? 0,
          });
        }
      } else {
        setUsers([]);
        if (!usersRes.ok) toastError(usersRes.message || "Failed to load users");
      }
    } catch {
      toastError("Failed to load users from network");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [api, searchQuery, roleFilter]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  // Handle Role Assignment
  async function handleAssignRole(id: string, nextRole: string) {
    try {
      const res = await api(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) {
        toastError(res.message || "Failed to assign role");
        return;
      }
      toastSuccess(`Role updated to ${nextRole}`);
      await load();
    } catch {
      toastError("Network error updating role");
    }
  }

  // Handle Active/Inactive Toggle
  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      const res = await api(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) {
        toastError(res.message || "Failed to update user status");
        return;
      }
      toastSuccess(currentActive ? "User deactivated" : "User activated");
      await load();
    } catch {
      toastError("Network error updating status");
    }
  }

  useEffect(() => {
    if (gateError) toastError(gateError);
  }, [gateError]);


  // Pagination
  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return users.slice(start, start + ITEMS_PER_PAGE);
  }, [users, currentPage]);

  // Initial Loading State - Avoids Empty State Flash
  if (!ready || (loading && users.length === 0)) {
    return (
      <AdminShell
        adminName={adminName}
        title="All users"
        subtitle="Unified multi-role user directory."
        guideKey="users"
      >
        <div className="flex items-center justify-center min-h-[50vh] text-gray-400 dark:text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-ona-brand" />
          Loading users…
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      adminName={adminName}
      title="All users"
      subtitle="Unified multi-role user directory."
      guideKey="users"
    >
      {/* 6 Metric Stat Cards */}
      <UsersStatCards
        customersCount={counts.customersCount}
        customerT2Pending={counts.customerT2Pending}
        prosCount={counts.prosCount}
        proNeedsAction={counts.proNeedsAction}
        proT2Pending={counts.proT2Pending}
        proT4Pending={counts.proT4Pending}
      />

      {/* All Users Table */}
      <UsersTable
        users={paginatedUsers}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onRefresh={() => void load()}
        onAssignRole={handleAssignRole}
        onToggleActive={handleToggleActive}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </AdminShell>
  );
}
