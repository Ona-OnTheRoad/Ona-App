"use client";

import { useCallback, useId, useMemo } from "react";
import { SheetSelect, type SheetOption } from "@/components/ui/option-sheet";
import { cn } from "@/lib/utils";

/** Machine picker field: a button that opens a searchable bottom sheet. */
export function SearchSelect({
  label,
  value,
  placeholder,
  options,
  disabled,
  isLight,
  filter,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  isLight: boolean;
  filter: (options: string[], query: string, limit?: number) => string[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  void isLight;
  const sheetOptions = useMemo<SheetOption[]>(
    () => options.map((o) => ({ value: o, label: o })),
    [options],
  );
  const filterFn = useCallback(
    (all: SheetOption[], query: string) => {
      const byLabel = new Map(all.map((o) => [o.label, o]));
      return filter(
        all.map((o) => o.label),
        query,
        all.length,
      )
        .map((l) => byLabel.get(l))
        .filter((o): o is SheetOption => o != null);
    },
    [filter],
  );

  return (
    <div className="relative block">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-semibold text-ona-ink"
      >
        {label}
      </label>
      <SheetSelect
        id={id}
        value={value}
        options={sheetOptions}
        placeholder={placeholder}
        title={label}
        disabled={disabled}
        filterFn={filterFn}
        className={cn(disabled && "cursor-not-allowed opacity-55")}
        onChange={onChange}
      />
    </div>
  );
}
