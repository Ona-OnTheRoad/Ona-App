"use client";

import Link from "next/link";
import { formatMoneyMinor } from "@/lib/pricing";
import { toneClass } from "@/lib/payments/use-payment-history";
import type { usePaymentHistory } from "@/lib/payments/use-payment-history";

type Row = ReturnType<typeof usePaymentHistory>["rows"][number];

interface ActivityLedgerListProps {
  rows: Row[];
  isPro: boolean;
  isLight: boolean;
}

export function ActivityLedgerList({
  rows,
  isPro,
  isLight,
}: ActivityLedgerListProps) {
  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface divide-y divide-ona-border overflow-hidden shadow-xs">
      {rows.map((p) => {
        const displayAmt =
          isPro && p.proPayoutMinor != null ? p.proPayoutMinor : p.amountMinor;

        return (
          <Link
            key={p.id}
            href={p.href}
            className="flex items-center justify-between px-4 py-3.5 no-underline transition-colors hover:bg-ona-field/50 active:bg-ona-field"
          >
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-[16px] font-bold tabular-nums tracking-tight text-brand">
                {formatMoneyMinor(displayAmt, p.currency)}
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-ona-muted">
                {new Date(p.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                <span className="mx-1.5 opacity-40">·</span>
                {new Date(p.createdAt).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={`text-[12px] font-bold leading-tight ${toneClass(
                  p.statusTone,
                  isLight,
                )}`}
              >
                {p.statusLabel}
              </p>
              {p.provider ? (
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ona-muted">
                  {p.provider}
                </p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
