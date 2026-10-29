"use client";

import { useId, useMemo } from "react";
import { SheetSelect, type SheetOption } from "@/components/ui/option-sheet";
import type { BankOption } from "@/lib/bank-details";
import {
  parseSelectValue,
  selectValue,
} from "@/components/auth/bank-details-fields/select-value";

interface BankSelectDropdownProps {
  banks: BankOption[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  bankCode?: string;
  countryIso?: string;
}

export function BankSelectDropdown({
  banks,
  value,
  onChange,
  loading,
  bankCode,
  countryIso = "NG",
}: BankSelectDropdownProps) {
  const id = useId();

  const { options, selectedValue } = useMemo(() => {
    const list: SheetOption[] = banks.map((b) => ({
      value: selectValue(b.code, b.name),
      label: b.name,
      hint: b.code,
    }));
    const { code, name } = parseSelectValue(value);
    if (!code) return { options: list, selectedValue: "" };
    const found = banks.find((b) => b.code === code);
    if (found)
      return {
        options: list,
        selectedValue: selectValue(found.code, found.name),
      };
    // Saved bank that is not in the loaded list: keep it selectable.
    const saved = selectValue(code, name);
    return {
      options: [{ value: saved, label: name || code, hint: code }, ...list],
      selectedValue: saved,
    };
  }, [banks, value]);

  const labelSuffix = loading
    ? "(LOADING...)"
    : countryIso !== "NG"
      ? `(${countryIso})`
      : "";

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ona-ink"
      >
        Bank {labelSuffix}
      </label>

      <SheetSelect
        id={id}
        title="Select bank"
        value={selectedValue}
        options={options}
        loading={loading}
        disabled={loading}
        placeholder={loading ? "Loading banks..." : "Select bank"}
        searchPlaceholder="Search banks"
        emptyText="No matching banks"
        onChange={onChange}
      />

      {bankCode ? (
        <p className="text-[12px] font-normal text-ona-muted pt-0.5">
          Bank code:{" "}
          <span className="font-medium text-ona-ink dark:text-ona-muted">{bankCode}</span>
        </p>
      ) : null}
    </div>
  );
}
