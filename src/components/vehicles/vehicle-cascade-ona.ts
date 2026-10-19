/** Class tokens for VehicleCascadeFields `variant="ona"` (redesigned screens). */
export const ONA_CASCADE = {
  field:
    "h-12 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-3.5 text-[14px] font-medium text-ona-ink outline-none transition-colors focus:border-ona-ink disabled:opacity-60",
  list: "absolute z-50 mt-1 max-h-44 w-full overflow-y-auto overscroll-contain rounded-ona-ctl border border-ona-border bg-ona-surface shadow-lg",
  item: "px-3 py-2.5 text-left text-[13px] text-ona-ink",
  label: "mb-1.5 block text-[13px] font-semibold text-ona-ink",
  highlight: "bg-ona-brand-soft",
  model: "e.g. Corolla",
  year: "e.g. 2018",
} as const;

/** Model/Year placeholders: the redesigned sheet shows examples, the older variants show hints. */
export function cascadePlaceholders(
  variant: "auth" | "profile" | "ona",
  make: string,
  model: string,
): { model: string; year: string } {
  if (variant === "ona")
    return { model: ONA_CASCADE.model, year: ONA_CASCADE.year };
  return {
    model: make ? "Search model" : "Pick make first",
    year: make && model ? "Search year" : "Pick make and model first",
  };
}
