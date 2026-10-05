"use client";

import { useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import {
  VerificationBlockedPanel,
  VerificationWarningBanner,
} from "@/components/auth/verification-gate-banner";
import { PageHeader } from "@/components/layout/page-header";
import { OrderCard } from "@/components/orders/order-card";
import { useApp } from "@/lib/store";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import type { RequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Repair Pro order desk incoming motorist requests,
 * accept / en-route / complete flow.
 */
export default function ProOrdersPage() {
  const {
    requests,
    updateRequestStatus,
    theme,
    userMode,
    accountType,
    proServices,
    displayName,
    backendUserId,
  } = useApp();
  const isLight = theme === "light";
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [warning, setWarning] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleUpdate = async (id: string, status: RequestStatus) => {
    setBusyId(id);
    try {
      const result = await updateRequestStatus(id, status);
      if (!result.ok) {
        setBlocked(result.message);
        setWarning(null);
        return;
      }
      setBlocked(null);
      if (result.warning) setWarning(result.warning);
    } finally {
      setBusyId(null);
    }
  };

  const isPro = userMode === "professional" || accountType === "professional";

  const list = useMemo(() => {
    let rows = [...requests];
    // Account isolation: a pro's desk only ever shows THEIR assigned jobs,
    // never another pro's requests (defense in depth behind the per-user feed).
    if (isPro && backendUserId) {
      rows = rows.filter((r) => r.technicianId === backendUserId);
    }
    if (filter === "open") {
      rows = rows.filter((r) => !["completed", "cancelled"].includes(r.status));
    }
    return rows.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [requests, filter, isPro, backendUserId]);

  if (!isPro) {
    return (
      <div
        className={cn(
          "flex h-full flex-col",
          isLight ? "bg-[#c8c9cd]" : "bg-black",
        )}
      >
        <PageHeader title="Orders" subtitle="Repair Pro only" backHref="/" />
        <p className="p-4 text-sm text-muted">
          Switch to Professional mode in the menu to manage job orders.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        isLight ? "bg-[#c8c9cd]" : "bg-black",
      )}
    >
      <PageHeader
        title="Order requests"
        subtitle={`${displayName} · ${proServices.map((s) => PRO_SERVICE_LABELS[s]).join(" · ") || "Pro"}`}
        backHref="/dashboard"
      />

      <div className="flex gap-2 px-3 pb-2">
        {(
          [
            ["open", "Active"],
            ["all", "All"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-lg border-0 px-3 py-1.5 text-[12px] font-bold",
              filter === id
                ? "bg-brand text-white"
                : isLight
                  ? "bg-white text-slate-600"
                  : "bg-white/10 text-white/75",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4 scrollbar-hide">
        {warning && (
          <VerificationWarningBanner
            message={warning}
            isLight={isLight}
            onDismiss={() => setWarning(null)}
          />
        )}
        {blocked && (
          <VerificationBlockedPanel
            message={blocked}
            isLight={isLight}
            onClose={() => setBlocked(null)}
          />
        )}
        {list.length === 0 ? (
          <div
            className={cn(
              "rounded-xl p-6 text-center",
              isLight ? "bg-[#c8c9cd]" : "bg-white/5",
            )}
          >
            <Clock3
              className={cn(
                "mx-auto h-8 w-8",
                isLight ? "text-slate-300" : "text-white/30",
              )}
            />
            <p
              className={cn(
                "mt-2 text-sm font-semibold",
                isLight ? "text-slate-800" : "text-white",
              )}
            >
              No {filter === "open" ? "active" : ""} orders yet
            </p>
            <p className="mt-1 text-[12px] text-muted">
              When customers request help in your trades, jobs appear here.
            </p>
          </div>
        ) : (
          list.map((job) => (
            <OrderCard
              key={job.id}
              job={job}
              isLight={isLight}
              busy={busyId === job.id}
              onUpdate={(id, status) => void handleUpdate(id, status)}
            />
          ))
        )}
      </div>
    </div>
  );
}
