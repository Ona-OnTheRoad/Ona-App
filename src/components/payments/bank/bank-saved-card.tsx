"use client";

import { Building2 } from "lucide-react";

interface BankSavedCardProps {
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  isPro: boolean;
  onEdit: () => void;
}

export function BankSavedCard({
  bankName,
  bankAccountNumber,
  bankAccountName,
  isPro,
  onEdit,
}: BankSavedCardProps) {
  const maskedNumber = bankAccountNumber
    ? `••••${bankAccountNumber.slice(-4)}`
    : "Not set";

  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-5 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ona-ctl bg-brand/10 text-brand">
            <Building2 className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-ona-ink">Your bank</p>
            <p className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
              {isPro ? "Ready for payouts" : "Ready for refunds"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-ona-ctl border border-ona-border bg-ona-surface px-3 py-1.5 text-[12px] font-bold text-ona-ink hover:bg-ona-field transition-colors cursor-pointer"
        >
          Edit
        </button>
      </div>

      <div className="rounded-ona-ctl bg-ona-field/60 border border-ona-border p-3.5 space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-ona-muted">
            Bank
          </p>
          <p className="text-[14px] font-semibold text-ona-ink mt-0.5">
            {bankName || "Not set"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-ona-muted">
            Account number
          </p>
          <p className="text-[14px] font-semibold text-ona-ink mt-0.5 font-mono">
            {maskedNumber}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-ona-muted">
            Account name
          </p>
          <p className="text-[14px] font-semibold text-ona-ink mt-0.5">
            {bankAccountName || "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
}
