"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { BankOption } from "@/lib/bank-details";
import { parseSelectValue, selectValue } from "@/components/auth/bank-details-fields/select-value";

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
    if (!open) {
      setQuery(selected?.name || "");
    }
  }, [open, selected?.name]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks.slice(0, 100);
    return banks
      .filter(
        (b) =>
          b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q),
      )
      .slice(0, 100);
  }, [banks, query]);

  const pick = (b: BankOption) => {
    onChange(selectValue(b.code, b.name));
    setQuery(b.name);
    setOpen(false);
  };

  const labelSuffix = loading
    ? "(LOADING...)"
    : countryIso !== "NG"
      ? `(${countryIso})`
      : "";

  return (
    <div className="space-y-1.5" ref={wrapRef}>
      <label
        htmlFor={id}
        className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ona-ink"
      >
        Bank {labelSuffix}
      </label>

      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          disabled={loading}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-popup`}
          placeholder={loading ? "Loading banks..." : "Select bank"}
          value={open ? query : selected?.name || query}
          onFocus={() => {
            if (!loading) {
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
            if (loading) return;
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
          className="h-12 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-4 pr-10 text-[13px] font-medium text-ona-ink outline-none transition-colors focus:border-ona-ink disabled:opacity-50"
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (!loading) {
              setOpen((prev) => !prev);
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-ona-muted hover:text-ona-ink transition-colors"
          aria-label="Toggle bank options"
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>

        {open && !loading ? (
          <div
            id={`${id}-popup`}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto overscroll-contain rounded-ona-ctl border border-ona-border bg-ona-surface shadow-lg scrollbar-hide"
          >
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-[12px] text-ona-muted">
                No matching banks
              </p>
            ) : (
              <ul className="m-0 list-none p-1">
                {filtered.map((b, i) => (
                  <li key={`${b.code}-${b.name}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={b.code === selected?.code}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(b);
                      }}
                      onMouseEnter={() => setHighlight(i)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                        i === highlight
                          ? "bg-ona-field text-ona-ink"
                          : "text-ona-ink hover:bg-ona-field/70"
                      }`}
                    >
                      {b.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {bankCode ? (
        <p className="text-[12px] font-normal text-ona-muted pt-0.5">
          Bank code:{" "}
          <span className="font-medium text-ona-ink">{bankCode}</span>
        </p>
      ) : null}
    </div>
  );
}
