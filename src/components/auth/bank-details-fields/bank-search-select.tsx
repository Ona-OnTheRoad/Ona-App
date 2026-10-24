"use client";

import { useId, useMemo } from "react";
import { SheetSelect, type SheetOption } from "@/components/ui/option-sheet";
import type { BankOption } from "@/lib/bank-details";
import { cn } from "@/lib/utils";
import { parseSelectValue, selectValue } from "./select-value";

export function BankSearchSelect({
  banks,
  value,
  onChange,
  disabled,
  fieldClass,
  ink,
}: {
  banks: BankOption[];
  value: string;
  onChange: (raw: string) => void;
  disabled?: boolean;
  fieldClass: string;
  muted?: string;
  ink: string;
  isLight?: boolean;
}) {
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
    const saved = selectValue(code, name);
    return {
      options: [{ value: saved, label: name || code, hint: code }, ...list],
      selectedValue: saved,
    };
  }, [banks, value]);

  return (
    <div className="relative mt-1">
      <SheetSelect
        id={id}
        bare
        title="Select bank"
        value={selectedValue}
        options={options}
        disabled={disabled}
        placeholder="Select bank"
        searchPlaceholder="Search banks"
        emptyText="No matching banks"
        className={cn(
          "h-11 rounded-lg border-0 px-3 text-[13px] font-semibold outline-none",
          fieldClass,
          ink,
          disabled && "opacity-55",
        )}
        chevronClassName="text-current opacity-60"
        onChange={onChange}
      />
    </div>
  );
}
