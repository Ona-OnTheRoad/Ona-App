"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(
    () => filter(options, open ? query : value, 80),
    [filter, options, query, value, open],
  );

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  const fieldClass = isLight
    ? "h-11 w-full rounded-md border-0 bg-black/8 px-3 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-500"
    : "h-11 w-full rounded-md border-0 bg-[#2c2c2e] px-3 text-[14px] font-medium text-white outline-none placeholder:text-white/50";
  const listClass = isLight
    ? "absolute z-50 mt-1 max-h-44 w-full overflow-y-auto overscroll-contain rounded-md border border-black/10 bg-white shadow-lg"
    : "absolute z-50 mt-1 max-h-44 w-full overflow-y-auto overscroll-contain rounded-md border border-white/10 bg-[#1c1c1e] shadow-lg";
  const itemBase = isLight
    ? "px-3 py-2 text-left text-[13px] text-slate-900"
    : "px-3 py-2 text-left text-[13px] text-white";
  const labelClass = isLight
    ? "mb-1 block text-[12px] font-semibold text-slate-700"
    : "mb-1 block text-[12px] font-semibold text-white/70";

  const pick = (v: string) => {
    onChange(v);
    setQuery(v);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative block">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        className={cn(fieldClass, disabled && "cursor-not-allowed opacity-55")}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onFocus={() => {
          if (!disabled) {
            setOpen(true);
            setQuery(value);
          }
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (e.target.value !== value) onChange("");
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) =>
              Math.min(h + 1, Math.max(filtered.length - 1, 0)),
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[highlight]) pick(filtered[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
            setQuery(value);
          }
        }}
      />
      {open && !disabled && (
        <ul id={`${id}-list`} role="listbox" className={listClass}>
          {filtered.length === 0 ? (
            <li className={cn(itemBase, "opacity-60")}>No matches</li>
          ) : (
            filtered.map((opt, i) => (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opt === value}
                  className={cn(
                    itemBase,
                    "w-full border-0 bg-transparent",
                    i === highlight
                      ? isLight
                        ? "bg-[#FF6B35]/15"
                        : "bg-white/10"
                      : "hover:bg-black/5",
                  )}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(opt);
                  }}
                >
                  {opt}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
