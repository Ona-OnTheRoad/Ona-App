"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import type { AdminUsersResult } from "@/lib/server/identity/admin-users";

type MotoristRow = Extract<AdminUsersResult, { ok: true }>["users"][number];

export default function AdminCustomersHubPage() {
  const { adminName, adminRole, ready, api, error: gateError } = useAdminGate();
  const [users, setUsers] = useState<MotoristRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api<{ users: MotoristRow[] }>(
      "/api/admin/users?role=motorist",
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
      <h1 className="om-admin-h1">Motorists Administration</h1>
      <p className="om-admin-sub">Customer accounts with motorist as their primary role. Up to 300 recent accounts.</p>
      <AdminGuideBanner pageId="admin-motorists" />
      {failure ? <div className="om-admin-error" role="alert">{failure}</div> : null}
      <div className="om-admin-panel">
        <div className="om-admin-toolbar">
          <button type="button" className="om-admin-btn" disabled={!ready || loading} onClick={() => void load()}>
            Refresh
          </button>
        </div>
        {loading && !failure ? <p role="status">Loading motorists…</p> : null}
        {!loading && !failure ? (
          <table className="om-admin-table">
            <thead><tr><th>Name</th><th>Contact</th><th>Location</th><th>Status</th></tr></thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} className="om-admin-muted">No motorists found.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name || "Unnamed motorist"}</td>
                  <td><div>{user.email || "—"}</div><div className="om-admin-muted">{user.phone || "—"}</div></td>
                  <td>{[user.area, user.city].filter(Boolean).join(", ") || "—"}</td>
                  <td>{user.is_active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </AdminShell>
  );
}
