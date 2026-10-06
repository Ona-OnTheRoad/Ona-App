"use client";

/**
 * Shared bank form: searchable bank combobox (country-geo list) → code auto;
 * enter 10-digit account number → account name resolves (Flutterwave).
 * Dropdown opens downward never a full-page takeover.
 */

import { useState } from "react";
import {
  NG_BANKS,
  validateBankDetailsInput,
  type BankOption,
} from "@/lib/bank-details";
import { cn } from "@/lib/utils";
import { BankSearchSelect } from "./bank-details-fields/bank-search-select";
import { useBankDetailsFields } from "./bank-details-fields/use-bank-details-fields";
import type { BankDetailsValue } from "./bank-details-fields/types";

export type { BankDetailsValue };

export function BankDetailsFields({
  isLight,
  initial,
  onChange,
  className,
  /** Signup full name account name must match ≥2 name parts */
  signupFullName,
  /** ISO country for bank list geo-fence (default NG) */
  countryIso,
}: {
  isLight: boolean;
  initial?: Partial<BankDetailsValue>;
  onChange?: (v: BankDetailsValue) => void;
  className?: string;
  signupFullName?: string | null;
  countryIso?: string | null;
}) {
  const {
    banks,
    bankCode,
    bankAccountName,
    bankAccountNumber,
    loadingBanks,
    resolving,
    resolveMsg,
    iso,
    selectVal,
    onSelectBank,
    onAccountNumberChange,
    onAccountNameChange,
  } = useBankDetailsFields({ initial, onChange, signupFullName, countryIso });

  const field = isLight
    ? "bg-[#e2e3e7] text-slate-900"
    : "bg-[#1c1c1e] text-white";
  const muted = isLight ? "text-slate-600" : "text-white/65";
  const ink = isLight ? "text-slate-900" : "text-white";

  return (
    <div className={cn("space-y-2.5", className)}>
      <label className="block">
        <span className={cn("text-[10px] font-bold uppercase", muted)}>
          Bank {loadingBanks ? "(loading…)" : iso !== "NG" ? `(${iso})` : ""}
        </span>
        <BankSearchSelect
          banks={banks}
          value={selectVal}
          onChange={onSelectBank}
          disabled={loadingBanks}
          fieldClass={field}
          muted={muted}
          ink={ink}
          isLight={isLight}
        />
      </label>

      {bankCode ? (
        <p className={cn("text-[12px] font-semibold", muted)}>
          Bank code:{" "}
          <span className="font-mono text-[#FF6B35]">{bankCode}</span>
        </p>
      ) : null}

      <label className="block">
        <span className={cn("text-[10px] font-bold uppercase", muted)}>
          Account number (10 digits)
        </span>
        <input
          className={cn(
            "mt-1 h-11 w-full rounded-lg border-0 px-3 text-[13px] font-semibold outline-none",
            field,
          )}
          value={bankAccountNumber}
          onChange={(e) => onAccountNumberChange(e.target.value)}
          inputMode="numeric"
          placeholder="0123456789"
          autoComplete="off"
        />
      </label>

      <label className="block">
        <span className={cn("text-[10px] font-bold uppercase", muted)}>
          Account name{" "}
          {resolving ? (
            <span className="normal-case font-medium text-[#FF6B35]">
              · Looking up…
            </span>
          ) : null}
        </span>
        <input
          className={cn(
            "mt-1 h-11 w-full rounded-lg border-0 px-3 text-[13px] font-semibold outline-none",
            field,
            resolving && "opacity-80",
          )}
          value={bankAccountName}
          onChange={(e) => onAccountNameChange(e.target.value)}
          placeholder={
            bankCode && bankAccountNumber.length === 10
              ? "Resolving account name…"
              : "Select bank + enter number to auto-fill"
          }
          readOnly={resolving}
        />
        {resolveMsg ? (
          <p
            className={cn(
              "mt-1 text-[11px] font-semibold",
              resolveMsg === "Name verified" ||
                resolveMsg.toLowerCase().includes("verified")
                ? "text-emerald-600"
                : "text-red-500",
            )}
          >
            {resolveMsg}
          </p>
        ) : null}
      </label>
    </div>
  );
}

export function useBankDetailsValue(
  initial?: Partial<BankDetailsValue>,
): [
  BankDetailsValue,
  (v: BankDetailsValue) => void,
  (list?: BankOption[]) => string | null,
] {
  const [value, setValue] = useState<BankDetailsValue>({
    bankCode: initial?.bankCode || "",
    bankName: initial?.bankName || "",
    bankAccountName: initial?.bankAccountName || "",
    bankAccountNumber: initial?.bankAccountNumber || "",
  });

  const validate = (list: BankOption[] = NG_BANKS) =>
    validateBankDetailsInput(value, list);

  return [value, setValue, validate];
}
