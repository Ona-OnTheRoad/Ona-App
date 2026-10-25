"use client";

import { SheetSelect } from "@/components/ui/option-sheet";
import { Loader2 } from "lucide-react";
import { useBankDetailsFields } from "@/components/auth/bank-details-fields/use-bank-details-fields";
import type { BankDetailsValue } from "@/components/auth/bank-details-fields/types";

interface Step5BankAccountProps {
  initialDetails?: Partial<BankDetailsValue>;
  signupFullName?: string | null;
  onContinue: (details: BankDetailsValue) => void;
  onSkip: () => void;
  busy?: boolean;
}

export function Step5BankAccount({
  initialDetails,
  signupFullName,
  onContinue,
  onSkip,
  busy = false,
}: Step5BankAccountProps) {
  const {
    banks,
    bankCode,
    bankAccountName,
    bankAccountNumber,
    resolving,
    resolveMsg,
    selectVal,
    onSelectBank,
    onAccountNumberChange,
    onAccountNameChange,
  } = useBankDetailsFields({
    initial: initialDetails,
    signupFullName,
    countryIso: "NG",
  });

  const bankName = banks.find((b) => b.code === bankCode)?.name || "";

  const numDigits = bankAccountNumber.replace(/\D/g, "");
  const hasValidAccount =
    bankCode.trim().length > 0 &&
    numDigits.length === 10 &&
    bankAccountName.trim().length > 0;

  const handleContinue = () => {
    onContinue({
      bankCode,
      bankName,
      bankAccountNumber: numDigits,
      bankAccountName,
    });
  };

  return (
    <div className="flex flex-col flex-1 px-5 pt-4 pb-6 bg-ona-bg text-ona-ink">
      {/* Title & Subtitle */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ona-ink tracking-tight">
          Bank Account
        </h1>
        <p className="mt-1 text-xs text-ona-muted">
          Add your payout bank account for earning withdrawals. You can also skip and set this up later.
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        {/* Bank Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Bank
          </label>
          <SheetSelect
            bare
            title="Bank"
            value={selectVal}
            onChange={(v) => onSelectBank(v)}
            placeholder="Select your bank"
            searchPlaceholder="Search banks"
            options={banks.map((b) => ({
              value: `${b.code}::${b.name}`,
              label: b.name,
            }))}
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink font-medium outline-none focus:outline-none"
            chevronClassName="right-3.5 text-ona-muted"
          />
          {bankCode && (
            <span className="text-[11px] text-ona-muted pl-0.5">
              Bank code: {bankCode}
            </span>
          )}
        </div>

        {/* Account Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Account number (10 DIGITS)
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={bankAccountNumber}
            onChange={(e) => onAccountNumberChange(e.target.value)}
            placeholder="0123456789"
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted tracking-wider font-mono outline-none focus:outline-none"
          />
        </div>

        {/* Account Name */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="step5-account-name" className="text-xs font-semibold text-ona-ink">
              {resolving ? "Account name · Looking up …" : "Account name"}
            </label>
            {resolving && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
            )}
          </div>
          <input
            id="step5-account-name"
            type="text"
            value={bankAccountName}
            onChange={(e) => onAccountNameChange(e.target.value)}
            placeholder="Enter account name"
            autoComplete="name"
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted uppercase font-medium tracking-wide outline-none focus:outline-none"
          />
          {resolveMsg && (
            <span
              className={`text-[11px] font-semibold pl-0.5 ${
                resolveMsg === "Name verified" ||
                resolveMsg.toLowerCase().includes("verified")
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-ona-muted"
              }`}
            >
              {resolveMsg}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!hasValidAccount || busy}
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
            hasValidAccount && !busy
              ? "bg-brand hover:opacity-90 text-white active:scale-[0.99]"
              : "bg-brand/50 text-white cursor-not-allowed"
          }`}
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account…</span>
            </>
          ) : (
            "Continue"
          )}
        </button>

        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          className="w-full py-2.5 text-center text-sm font-semibold text-ona-muted hover:text-ona-ink transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
