"use client";

import { ChevronDown, Loader2 } from "lucide-react";
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
    selectVal,
    onSelectBank,
    onAccountNumberChange,
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
    <div className="flex flex-col flex-1 px-5 pt-4 pb-6 bg-white dark:bg-[#121316]">
      {/* Title & Subtitle */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Bank Account
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          This helps your professional arrive with the right tools and parts.
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        {/* Bank Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Bank
          </label>
          <div className="relative">
            <select
              value={selectVal}
              onChange={(e) => onSelectBank(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 pr-10 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            >
              <option value="">Select your bank</option>
              {banks.map((b) => (
                <option key={`${b.code}-${b.name}`} value={`${b.code}::${b.name}`}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {bankCode && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 pl-0.5">
              Bank code: {bankCode}
            </span>
          )}
        </div>

        {/* Account Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Account number (10 DIGITS)
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={bankAccountNumber}
            onChange={(e) => onAccountNumberChange(e.target.value)}
            placeholder="0123456789"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
          />
        </div>

        {/* Account Name Lookup */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {resolving
                ? "Account name · Looking up …"
                : "Account name"}
            </label>
            {resolving && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B35]" />
            )}
          </div>
          <div className="w-full min-h-[46px] flex items-center bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3">
            <span
              className={`text-sm uppercase tracking-wide ${
                bankAccountName
                  ? "text-slate-900 dark:text-white font-semibold"
                  : "text-slate-400 italic"
              }`}
            >
              {bankAccountName || "Enter 10 digits to resolve name"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!hasValidAccount || busy}
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 ${
            hasValidAccount && !busy
              ? "bg-[#FF6B35] hover:bg-[#e85a26] text-white active:scale-[0.99]"
              : "bg-[#FF6B35]/50 text-white cursor-not-allowed"
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
          className="w-full py-2.5 text-center text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
