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

  void isLight;
  const fieldClass =
    "h-12 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-3.5 text-[14px] font-medium text-ona-ink outline-none transition-colors focus:border-ona-ink disabled:opacity-60";
  const listClass =
    "absolute z-50 mt-1 max-h-44 w-full overflow-y-auto overscroll-contain rounded-ona-ctl border border-ona-border bg-ona-surface shadow-lg";
  const itemBase = "px-3 py-2.5 text-left text-[13px] text-ona-ink";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-ona-ink";

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
                      ? "bg-ona-brand-soft"
                      : "hover:bg-ona-field",
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
