"use client";

/**
 * Admin Payment Control Cockpit
 * View customer → pro money path, stop processing, force payout, refund.
 * Does not change payment engine rules; calls existing APIs only.
 * Force payout / standalone: L4-L5. Refund / stop processing: L3+.
 * Never double-pays (stable ona_rel_ / ledger + FLW lookup).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { withSensitivePassword } from "@/components/admin/sensitive-unlock";
import {
  adminRoleLabel,
  canCancelEscrowUi,
  canForcePayoutUi,
  normalizeAdminRoleUi,
} from "@/lib/admin-role-ui";
import type { PaymentDetailData } from "@/components/admin/payment-detail/types";
import { PartiesPanel } from "@/components/admin/payment-detail/parties-panel";
import { EscrowPanel } from "@/components/admin/payment-detail/escrow-panel";
import { ControlsPanel } from "@/components/admin/payment-detail/controls-panel";
import {
  FlwTransfersPanel,
  LedgerPanel,
} from "@/components/admin/payment-detail/transfer-tables";

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const { adminName, adminRole, ready, api } = useAdminGate();
  const role = normalizeAdminRoleUi(adminRole);
  const canCancel = canCancelEscrowUi(role);
  const canForce = canForcePayoutUi(role);

  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [data, setData] = useState<PaymentDetailData | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api<PaymentDetailData>(
      `/api/admin/payments/${encodeURIComponent(id)}`,
    );
    if (!res.ok) {
      setError(res.message);
      setData(null);
      return;
    }
    setData(res.data as typeof data);
    setError(null);
  }, [api, id]);

  useEffect(() => {
    if (!ready || !id) return;
    void load();
  }, [ready, id, load]);

  const p = data?.payment;
  const meta = (p?.meta || {}) as Record<string, unknown>;
  const esc = String(p?.escrow_status || "").toLowerCase();
  const alreadyPaid =
    esc === "released" ||
    meta.proTransferOk === true ||
    meta.payoutStatus === "success" ||
    data?.flwLookup?.found === true;

  const successFlw = useMemo(
    () =>
      (data?.flwTransfers || []).filter((t) =>
        /success/i.test(String(t.status || "")),
      ),
    [data?.flwTransfers],
  );

  async function runAction(
    title: string,
    detail: string,
    body: Record<string, unknown>,
    okMsg: string,
  ) {
    setBusy(true);
    setMsg(null);
    setError(null);
    await withSensitivePassword({ title, detail }, async () => {
      const res = await api<{
        message?: string;
        result?: { ok?: boolean; message?: string; alreadyReleased?: boolean };
      }>("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const r = res.data.result;
      if (r && r.ok === false) {
        setError(r.message || "Action did not complete");
      } else {
        setMsg(
          res.data.message ||
            (r?.alreadyReleased ? "Already paid (no second transfer)" : okMsg),
        );
      }
      await load();
    });
    setBusy(false);
  }

  function requireNote(): string | null {
    const r = note.trim();
    if (r.length < 8) {
      setError("Enter a reason (min 8 characters) in the note box first.");
      return null;
    }
    return r;
  }

  return (
    <AdminShell adminName={adminName} adminRole={adminRole}>
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/admin/payments"
          className="om-admin-muted"
          style={{ fontSize: 13 }}
        >
          ← All payments
        </Link>
      </div>
      <h1 className="om-admin-h1">Payment control</h1>
      <p className="om-admin-sub">
        Full admin cockpit: customer collection → escrow → pro payout.{" "}
        <strong>Never double-pays</strong> (stable transfer ref + ledger + FLW
        check). Your role: {adminRoleLabel(role)}. Force payout: L4-L5. Refund /
        stop processing: L3+.
      </p>

      <AdminGuideBanner pageId="payment-detail" />
      {error ? <div className="om-admin-error">{error}</div> : null}
      {msg ? <div className="om-admin-success">{msg}</div> : null}
      {data?.doublePayRisk ? (
        <div className="om-admin-error" role="alert">
          {data.doublePayRisk}
        </div>
      ) : null}
      {alreadyPaid ? (
        <div className="om-admin-success" role="status">
          Pro payout already completed (or FLW shows success). Do not force a
          second transfer.
        </div>
      ) : null}

      {!data && !error ? <p className="om-admin-muted">Loading…</p> : null}

      {p ? (
        <>
          <PartiesPanel data={data} p={p} />
          <EscrowPanel data={data} p={p} meta={meta} successFlw={successFlw} />
          <ControlsPanel
            p={p}
            esc={esc}
            note={note}
            setNote={setNote}
            busy={busy}
            alreadyPaid={alreadyPaid}
            canCancel={canCancel}
            canForce={canForce}
            load={load}
            requireNote={requireNote}
            runAction={runAction}
          />
          <LedgerPanel data={data} />
          <FlwTransfersPanel data={data} />
        </>
      ) : null}
    </AdminShell>
  );
}
