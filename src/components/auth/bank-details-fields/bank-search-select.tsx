"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { BankOption } from "@/lib/bank-details";
import { cn } from "@/lib/utils";
import { parseSelectValue, selectValue } from "./select-value";

export function BankSearchSelect({
  banks,
  value,
  onChange,
  disabled,
  fieldClass,
  muted,
  ink,
  isLight,
}: {
  banks: BankOption[];
  value: string;
  onChange: (raw: string) => void;
  disabled?: boolean;
  fieldClass: string;
  muted: string;
  ink: string;
  isLight: boolean;
}) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const selected = useMemo(() => {
    const { code, name } = parseSelectValue(value);
    if (!code) return null;
    return banks.find((b) => b.code === code) || (name ? { code, name } : null);
  }, [banks, value]);

  useEffect(() => {
    if (!open) setQuery(selected?.name || "");
  }, [open, selected?.name]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks.slice(0, 80);
    return banks
      .filter(
        (b) =>
          b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q),
      )
      .slice(0, 80);
  }, [banks, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  const pick = (b: BankOption) => {
    onChange(selectValue(b.code, b.name));
    setQuery(b.name);
    setOpen(false);
  };

  const listClass = isLight
    ? "absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto overscroll-contain rounded-lg border border-black/10 bg-white shadow-lg"
    : "absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto overscroll-contain rounded-lg border border-white/10 bg-[#1c1c1e] shadow-lg";

  return (
    <div ref={wrapRef} className="relative mt-1">
      <input
        id={id}
        type="search"
        autoComplete="off"
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        placeholder="Search bank…"
        className={cn(
          "h-11 w-full rounded-lg border-0 px-3 text-[13px] font-semibold outline-none",
          fieldClass,
          disabled && "opacity-55",
        )}
        value={open ? query : selected?.name || query}
        onFocus={() => {
          if (!disabled) {
            setOpen(true);
            setQuery(selected?.name || "");
          }
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[highlight]) pick(filtered[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
            setQuery(selected?.name || "");
          }
        }}
      />
      {open && !disabled ? (
        <ul id={`${id}-list`} role="listbox" className={listClass}>
          {filtered.length === 0 ? (
            <li className={cn("px-3 py-2 text-[13px]", muted)}>No matches</li>
          ) : (
            filtered.map((b, i) => (
              <li key={`${b.code}::${b.name}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={b.code === selected?.code}
                  className={cn(
                    "w-full border-0 bg-transparent px-3 py-2 text-left text-[13px] font-semibold",
                    ink,
                    i === highlight
                      ? isLight
                        ? "bg-[#FF6B35]/15"
                        : "bg-white/10"
                      : isLight
                        ? "hover:bg-black/5"
                        : "hover:bg-white/10",
                  )}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(b);
                  }}
                >
                  {b.name}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
