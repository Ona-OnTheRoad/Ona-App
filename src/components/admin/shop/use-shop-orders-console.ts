"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { toastError, toastSuccess } from "@/lib/toast";
import type { AdminShopOrderDetail, AdminShopOrderRow } from "./types";

export function useShopOrdersConsole() {
  const gate = useAdminGate();
  const { ready, api } = gate;
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<AdminShopOrderRow[]>([]);
  const [needsAttention, setNeedsAttention] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminShopOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    const res = await api<{
      orders: AdminShopOrderRow[];
      needsAttention: number;
    }>(`/api/admin/shop/orders?${params.toString()}`);
    if (!res.ok) {
      toastError(res.message);
      return;
    }
    setOrders(res.data.orders);
    setNeedsAttention(res.data.needsAttention);
  }, [api, status, q]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      await loadList();
      if (!cancelled) setLoading(false);
    }, q ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [ready, loadList, q]);

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      const res = await api<AdminShopOrderDetail>(`/api/admin/shop/orders/${id}`);
      setDetailLoading(false);
      if (!res.ok) {
        toastError(res.message);
        return;
      }
      setDetail(res.data);
    },
    [api],
  );

  const open = (id: string) => {
    setSelectedId(id);
    setDetail(null);
    void loadDetail(id);
  };
  const close = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const refresh = async () => {
    await Promise.all([loadList(), selectedId ? loadDetail(selectedId) : null]);
  };

  const orderAction = async (action: "cancel" | "refund", reason?: string) => {
    if (!selectedId) return;
    setBusy(true);
    const res = await api(`/api/admin/shop/orders/${selectedId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, reason: reason || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      toastError(res.message);
      await refresh();
      return;
    }
    toastSuccess(action === "refund" ? "Order refunded" : "Order cancelled");
    await refresh();
  };

  const saveDelivery = async (input: {
    status?: string;
    courierName?: string;
    courierPhone?: string;
    trackingCode?: string;
    notes?: string;
  }) => {
    if (!selectedId) return;
    setBusy(true);
    const res = await api(`/api/admin/shop/deliveries`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId: selectedId, ...input }),
    });
    setBusy(false);
    if (!res.ok) {
      toastError(res.message);
      return;
    }
    toastSuccess("Delivery updated");
    await refresh();
  };

  return {
    ...gate,
    status,
    setStatus,
    q,
    setQ,
    orders,
    needsAttention,
    loading,
    selectedId,
    detail,
    detailLoading,
    busy,
    open,
    close,
    orderAction,
    saveDelivery,
  };
}
