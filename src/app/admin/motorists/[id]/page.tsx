"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import { one, type Detail } from "@/components/admin/motorist-detail/types";
import {
  IdentityPanel,
  ProfilePanel,
  VehiclePanel,
} from "@/components/admin/motorist-detail/profile-panels";
import { SyncPanel } from "@/components/admin/motorist-detail/sync-panel";
import {
  BookingsPanel,
  JobsPanel,
  PaymentsPanel,
} from "@/components/admin/motorist-detail/history-panels";

export default function AdminMotoristDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { adminName, ready, api, router } = useAdminGate();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api<Detail>(`/api/admin/users/${id}`);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setData(res.data);
    setError(null);
  }, [api, id]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  async function toggleActive() {
    if (!data) return;
    setBusy(true);
    setMsg(null);
    const res = await api(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !data.user.is_active }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMsg(data.user.is_active ? "Deactivated" : "Activated");
    await load();
  }

  async function hardDelete() {
    if (
      !window.confirm(
        `Hard-delete ${data?.user.full_name || "this motorist"} permanently?`,
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await api(`/api/admin/users/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.replace("/admin/motorists");
  }

  async function reSync() {
    if (!id) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    const res = await api(`/api/admin/users/${id}/sync`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMsg(
      `Identity sync re-run: roles ${((res.data as { roles?: string[] } | undefined)?.roles || []).join(", ") || ""}`,
    );
    await load();
  }

  const u = data?.user;
  const mot = one(u?.motorist_profiles);

  return (
    <AdminShell adminName={adminName}>
      <div className="om-admin-toolbar" style={{ marginBottom: 8 }}>
        <Link
          href="/admin/motorists"
          className="om-admin-btn ghost"
          style={{ textDecoration: "none" }}
        >
          ← All customers
        </Link>
      </div>
      <h1 className="om-admin-h1">{u?.full_name || "Customer"}</h1>
      <p className="om-admin-sub">
        Single customer record: profile, identity, vehicle, bank, and job
        history from the live Ona database. Approve ID or freeze the account
        here.
      </p>

      <AdminGuideBanner pageId="customer-detail" />

      {msg ? (
        <div
          className="om-admin-error"
          style={{ background: "#14532d", color: "#bbf7d0", marginBottom: 12 }}
        >
          {msg}
        </div>
      ) : null}
      {error ? <div className="om-admin-error">{error}</div> : null}

      {!data ? (
        <p className="om-admin-muted">Loading…</p>
      ) : (
        <>
          <div className="om-admin-cards">
            <div className="om-admin-card">
              <div className="label">Status</div>
              <div className="value" style={{ fontSize: 18 }}>
                {u?.is_active ? "Active" : "Inactive"}
              </div>
            </div>
            <div className="om-admin-card">
              <div className="label">Jobs</div>
              <div className="value">{data.jobs.length}</div>
            </div>
            <div className="om-admin-card">
              <div className="label">Bookings</div>
              <div className="value">{data.bookings.length}</div>
            </div>
            <div className="om-admin-card">
              <div className="label">Payments</div>
              <div className="value">{data.payments.length}</div>
            </div>
          </div>

          <ProfilePanel
            u={u}
            mot={mot}
            busy={busy}
            onToggleActive={() => toggleActive()}
            onHardDelete={() => hardDelete()}
          />

          <VehiclePanel mot={mot} />

          <IdentityPanel mot={mot} />

          <SyncPanel data={data} busy={busy} onReSync={() => void reSync()} />

          <JobsPanel jobs={data.jobs} />

          <BookingsPanel bookings={data.bookings} />

          <PaymentsPanel payments={data.payments} />
        </>
      )}
    </AdminShell>
  );
}
