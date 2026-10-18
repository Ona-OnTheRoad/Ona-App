"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import type { AdminUsersResult } from "@/lib/server/identity/admin-users";

type ProRow = Extract<AdminUsersResult, { ok: true }>["users"][number];

export default function AdminProsHubPage() {
  const { adminName, adminRole, ready, api, error: gateError } = useAdminGate();
  const [users, setUsers] = useState<ProRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api<{ users: ProRow[] }>(
      "/api/admin/users?role=repair_pro",
      { cache: "no-store" },
    );
    if (res.ok) setUsers(res.data.users);
    else setError(res.message);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const failure = gateError || error;

  return (
    <AdminShell adminName={adminName} adminRole={adminRole}>
      <h1 className="om-admin-h1">Pros Administration</h1>
      <p className="om-admin-sub">Repair Pro accounts, including dual-role accounts. Up to 400 recent pro profiles.</p>
      <AdminGuideBanner pageId="admin-pros" />
      {failure ? <div className="om-admin-error" role="alert">{failure}</div> : null}
      <div className="om-admin-panel">
        <div className="om-admin-toolbar">
          <button type="button" className="om-admin-btn" disabled={!ready || loading} onClick={() => void load()}>
            Refresh
          </button>
        </div>
        {loading && !failure ? <p role="status">Loading pros…</p> : null}
        {!loading && !failure ? (
          <table className="om-admin-table">
            <thead><tr><th>Name</th><th>Contact</th><th>Location</th><th>Trade</th><th>Status</th><th>Verified</th></tr></thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="om-admin-muted">No pros found.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name || "Unnamed pro"}</td>
                  <td><div>{user.email || "—"}</div><div className="om-admin-muted">{user.phone || "—"}</div></td>
                  <td>{[user.area, user.city].filter(Boolean).join(", ") || "—"}</td>
                  <td>{user.repair_pro_profiles?.primary_service || "—"}</td>
                  <td>{!user.is_active ? "Inactive" : user.repair_pro_profiles?.status || "—"}</td>
                  <td>{user.repair_pro_profiles?.verified ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </AdminShell>
  );
}
