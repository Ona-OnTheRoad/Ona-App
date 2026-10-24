"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";

export type SheetOption = {
  value: string;
  label: string;
  /** Secondary text under (or beside) the label, e.g. a bank code. */
  hint?: string;
  /** Compact text for the closed field (e.g. "+234"); defaults to label. */
  short?: string;
  disabled?: boolean;
};

/**
 * Rows are ~48px, so a list longer than this fills about half the phone
 * and gets a search field.
 */
export const SEARCH_THRESHOLD = 7;
/** Cap on rendered rows so very long lists (banks, makes) stay fast. */
const RENDER_LIMIT = 150;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

function defaultFilter(options: SheetOption[], query: string): SheetOption[] {
  const q = norm(query.trim());
  if (!q) return options;
  const starts: SheetOption[] = [];
  const includes: SheetOption[] = [];
  for (const o of options) {
    const hay = norm(`${o.label} ${o.hint ?? ""}`);
    if (norm(o.label).startsWith(q)) starts.push(o);
    else if (hay.includes(q)) includes.push(o);
  }
  return [...starts, ...includes];
}

/** Bottom-sheet list picker. Lists past SEARCH_THRESHOLD get a search field. */
export function OptionSheet({
  open,
  onClose,
  title,
  options,
  value,
  onSelect,
  searchable,
  searchPlaceholder = "Search",
  emptyText = "No matches",
  loading,
  filterFn,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: SheetOption[];
  value: string;
  onSelect: (value: string) => void;
  /** Force the search field on/off; defaults to on for long lists. */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  /** Custom matcher (synonyms, aliases); defaults to starts-with then contains. */
  filterFn?: (options: SheetOption[], query: string) => SheetOption[];
}) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const showSearch = searchable ?? options.length > SEARCH_THRESHOLD;

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(
    () => (filterFn ?? defaultFilter)(options, query),
    [options, query, filterFn],
  );
  const shown = filtered.slice(0, RENDER_LIMIT);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      titleId={titleId}
      surface="ona"
      className="ona2 text-ona-ink"
      heightPercent={showSearch ? 60 : 25}
      growToPercent={showSearch ? 85 : 70}
    >
      <h2 id={titleId} className="text-[16px] font-bold">
        {title}
      </h2>

      {showSearch ? (
        <div className="sticky top-0 z-[1] -mx-4 mt-3 bg-ona-surface px-4 pb-2">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ona-muted"
              strokeWidth={2}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              className="h-11 w-full rounded-ona-ctl border border-ona-border bg-ona-field pl-10 pr-3 text-[14px] font-medium text-ona-ink outline-none transition-colors placeholder:text-ona-muted focus:border-ona-ink"
            />
          </div>
        </div>
      ) : null}

      <ul
        role="listbox"
        aria-labelledby={titleId}
        className="m-0 mt-2 list-none p-0 pb-4"
      >
        {loading ? (
          <li className="px-1 py-4 text-[13px] text-ona-muted">Loading…</li>
        ) : shown.length === 0 ? (
          <li className="px-1 py-4 text-[13px] text-ona-muted">{emptyText}</li>
        ) : (
          shown.map((o) => {
            const selected = o.value === value;
            return (
              <li key={`${o.value}-${o.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={o.disabled}
                  onClick={() => {
                    onSelect(o.value);
                    onClose();
                  }}
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between gap-3 rounded-ona-ctl border-0 bg-transparent px-2 py-2.5 text-left text-[14px] text-ona-ink transition-colors active:bg-ona-field disabled:opacity-40",
                    selected && "bg-ona-brand-soft font-semibold",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.label}</span>
                    {o.hint ? (
                      <span className="block truncate text-[12px] font-normal text-ona-muted">
                        {o.hint}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <Check
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-ona-brand-ink"
                      strokeWidth={2.5}
                    />
                  ) : null}
                </button>
              </li>
            );
          })
        )}
        {filtered.length > shown.length ? (
          <li className="px-1 pt-3 text-center text-[12px] text-ona-muted">
            Showing {shown.length} of {filtered.length}. Type to narrow the
            list.
          </li>
        ) : null}
      </ul>
    </BottomSheet>
  );
}

/**
 * A select field that opens an OptionSheet. The trigger is a button, so a
 * `<label htmlFor={id}>` still labels it.
 */
export function SheetSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Select",
  title,
  disabled,
  invalid,
  searchable,
  searchPlaceholder,
  emptyText,
  loading,
  filterFn,
  className,
  wrapperClassName,
  triggerLabel,
  leading,
  bare,
  style,
  chevronClassName,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  onOpen,
}: {
  id?: string;
  value: string;
  options: SheetOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Sheet heading; defaults to the field's <label> text, then "Select". */
  title?: string;
  disabled?: boolean;
  invalid?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  filterFn?: (options: SheetOption[], query: string) => SheetOption[];
  className?: string;
  wrapperClassName?: string;
  /** Compact text for the closed field (e.g. "+234") instead of the full label. */
  triggerLabel?: (selected: SheetOption) => ReactNode;
  leading?: ReactNode;
  /** Skip the Ona field styling; `className` (and `style`) then own the look. */
  bare?: boolean;
  style?: CSSProperties;
  chevronClassName?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  onOpen?: () => void;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState(title ?? ariaLabel ?? "Select");
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn("relative", wrapperClassName)}>
      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        data-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => {
          const label = document
            .querySelector(`label[for="${CSS.escape(fieldId)}"]`)
            ?.textContent?.replace(/\*/g, "")
            .trim();
          setSheetTitle(title ?? ariaLabel ?? (label || "Select"));
          onOpen?.();
          setOpen(true);
        }}
        style={style}
        className={cn(
          bare
            ? "flex w-full items-center gap-2 pr-9 text-left disabled:cursor-not-allowed"
            : "flex h-12 w-full items-center gap-2 rounded-ona-ctl border border-ona-border bg-ona-field px-3.5 pr-9 text-left text-[14px] font-medium text-ona-ink outline-none transition-colors focus-visible:border-ona-ink disabled:cursor-not-allowed disabled:opacity-60",
          invalid && !bare && "border-ona-danger",
          className,
        )}
      >
        {leading}
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && "text-ona-muted",
          )}
        >
          {selected
            ? triggerLabel
              ? triggerLabel(selected)
              : (selected.short ?? selected.label)
            : placeholder}
        </span>
      </button>
      <ChevronDown
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ona-muted",
          chevronClassName,
        )}
        strokeWidth={2}
      />
      <OptionSheet
        open={open}
        onClose={() => setOpen(false)}
        title={sheetTitle}
        options={options}
        value={value}
        onSelect={onChange}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        loading={loading}
        filterFn={filterFn}
      />
    </div>
  );
}
