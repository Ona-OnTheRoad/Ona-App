import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall, effectiveOf } from "./helpers";
import type { Detail, FilterKey, Ops, Payment } from "./types";

export function usePaymentsConsole() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filterCounts, setFilterCounts] = useState<Record<string, number>>({});
  const [ops, setOps] = useState<Ops | null>(null);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [canCancel, setCanCancel] = useState(false);
  const [canForce, setCanForce] = useState(false);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await apiCall<{
        fullName?: string;
        email?: string;
        adminRole?: string;
      }>("/api/admin/auth/me");
      if (!me.ok) {
        router.replace("/admin/login");
        return;
      }
      setAdminName(me.data.fullName || me.data.email || "Admin");
      setAdminRole(String(me.data.adminRole || ""));
      setAuthed(true);
    })();
  }, [router]);

  const loadPayments = useCallback(async () => {
    const res = await apiCall<{
      payments: Payment[];
      filterCounts?: Record<string, number>;
      ops?: Ops | null;
      opsError?: string | null;
      access?: { canCancelEscrow?: boolean; canRetryPayout?: boolean };
    }>("/api/admin/payments");
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setPayments(Array.isArray(res.data.payments) ? res.data.payments : []);
    setFilterCounts(res.data.filterCounts || {});
    setOps(res.data.ops || null);
    setOpsError(res.data.opsError || null);
    setCanCancel(Boolean(res.data.access?.canCancelEscrow));
    setCanRetry(Boolean(res.data.access?.canRetryPayout));
    setCanForce(Boolean(res.data.access?.canRetryPayout));
    setError(null);
  }, []);

  useEffect(() => {
    if (authed) {
      void loadPayments();
      const t = setInterval(() => void loadPayments(), 120_000);
      return () => clearInterval(t);
    }
  }, [authed, loadPayments]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setError(null);
    const res = await apiCall<Detail>(
      `/api/admin/payments/${encodeURIComponent(id)}`,
    );
    setDetailLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setDetail(res.data);
  }, []);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
      setNote("");
    } else {
      setDetail(null);
    }
  }, [selectedId, loadDetail]);

  async function withPassword(action: () => Promise<void>) {
    if (!password.trim()) {
      setShowPassword(true);
      setPendingAction(() => action);
      return;
    }
    setShowPassword(false);
    setPendingAction(null);
    setBusy(true);
    setMsg(null);
    setError(null);
    const unlock = await apiCall<{ expiresAt?: string }>(
      "/api/admin/care/unlock",
      { method: "POST", body: JSON.stringify({ password: password.trim() }) },
    );
    if (!unlock.ok) {
      setError(unlock.message || "Invalid password");
      setBusy(false);
      setPassword("");
      return;
    }
    try {
      await action();
    } catch {
      setError("Action failed");
    }
    setBusy(false);
  }

  async function runAction(body: Record<string, unknown>, okMsg: string) {
    await withPassword(async () => {
      const res = await apiCall<{
        message?: string;
        result?: { ok?: boolean; message?: string };
      }>("/api/admin/payments", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const r = res.data.result;
      if (r && r.ok === false) {
        setError(r.message || "Action failed");
      } else {
        setMsg(res.data.message || okMsg);
      }
      await loadPayments();
      if (selectedId) await loadDetail(selectedId);
    });
  }

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        const e = effectiveOf(p);
        if (filter === "all") return true;
        if (filter === "held") return e === "held" || e === "pending_payment";
        if (filter === "pending_settlement")
          return e === "pending_settlement" || e === "release_pending";
        if (filter === "suspended") return e === "suspended";
        if (filter === "released") return e === "released";
        if (filter === "failed") return e === "failed";
        if (filter === "refunded") return e === "refunded";
        return true;
      }),
    [payments, filter],
  );

  const counts = useMemo(() => {
    if (filterCounts.all != null) return filterCounts;
    const c: Record<string, number> = {
      all: payments.length,
      held: 0,
      pending_settlement: 0,
      suspended: 0,
      released: 0,
      failed: 0,
      refunded: 0,
    };
    for (const p of payments) {
      const e = effectiveOf(p);
      if (e === "held" || e === "pending_payment") c.held += 1;
      else if (e === "suspended") c.suspended += 1;
      else if (e === "pending_settlement" || e === "release_pending")
        c.pending_settlement += 1;
      else if (e === "released") c.released += 1;
      else if (e === "failed") c.failed += 1;
      else if (e === "refunded") c.refunded += 1;
    }
    return c;
  }, [filterCounts, payments]);

  const esc = String(detail?.payment?.escrow_status || "").toLowerCase();
  const meta = (detail?.payment?.meta || {}) as Record<string, unknown>;
  const alreadyPaid =
    esc === "released" ||
    meta.proTransferOk === true ||
    meta.payoutStatus === "success" ||
    detail?.flwLookup?.found === true;

  return {
    router,
    authed,
    adminName,
    adminRole,
    payments,
    ops,
    opsError,
    loading,
    error,
    setError,
    msg,
    setMsg,
    busy,
    filter,
    setFilter,
    selectedId,
    setSelectedId,
    detail,
    setDetail,
    detailLoading,
    note,
    setNote,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    pendingAction,
    setPendingAction,
    canCancel,
    canForce,
    canRetry,
    loadPayments,
    loadDetail,
    withPassword,
    runAction,
    filtered,
    counts,
    esc,
    meta,
    alreadyPaid,
  };
}
