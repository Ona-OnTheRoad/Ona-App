"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchSelect } from "./search-select";

export type MachinePickerViewProps = {
  isLight: boolean;
  question: string;
  canNext: boolean;
  onNext: () => void;
  otherMode: boolean;
  typeValue: string;
  typeOptions: string[];
  typePlaceholder: string;
  onTypeChange: (label: string) => void;
  brand: string;
  brands: string[];
  onBrandChange: (v: string) => void;
  model: string;
  models: string[];
  onModelChange: (v: string) => void;
  typeId: string;
  filter: (options: string[], query: string, limit?: number) => string[];
  other: string;
  onOtherChange: (v: string) => void;
  otherPlaceholder: string;
  otherHint: string;
  /** Extra classes on the "describe it" hint line. */
  otherHintClassName?: string;
  onNone: () => void;
  onOtherMode: () => void;
};

/** Presentational body shared by the generator and solar machine pickers. */
export function MachinePickerView({
  isLight,
  question,
  canNext,
  onNext,
  otherMode,
  typeValue,
  typeOptions,
  typePlaceholder,
  onTypeChange,
  brand,
  brands,
  onBrandChange,
  model,
  models,
  onModelChange,
  typeId,
  filter,
  other,
  onOtherChange,
  otherPlaceholder,
  otherHint,
  otherHintClassName,
  onNone,
  onOtherMode,
}: MachinePickerViewProps) {
  void isLight;
  const ink = "text-ona-ink";
  const muted = "text-ona-muted";
  const rowCard = "bg-ona-field-strong";
  const field =
    "border border-ona-border bg-ona-field text-ona-ink placeholder:text-ona-muted focus:border-ona-ink";

  return (
    <div>
      <div className="mt-2 flex items-center gap-1 px-0.5 pb-2">
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          aria-label="Next"
          className="border-0 bg-transparent p-0.5 text-ona-brand-ink disabled:opacity-40"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
        </button>
        <p className={cn("text-[14px] font-bold leading-snug", ink)}>
          {question}
        </p>
      </div>

      {!otherMode ? (
        <div className="flex flex-col gap-2.5">
          <SearchSelect
            label="Type"
            value={typeValue}
            placeholder={typePlaceholder}
            options={typeOptions}
            isLight={isLight}
            filter={filter}
            onChange={onTypeChange}
          />
          <SearchSelect
            label="Brand"
            value={brand}
            placeholder={typeId ? "Search brand" : "Pick a type first"}
            options={brands}
            disabled={!typeId}
            isLight={isLight}
            filter={filter}
            onChange={onBrandChange}
          />
          <SearchSelect
            label="Model"
            value={model}
            placeholder={brand ? "Search model" : "Pick a brand first"}
            options={models}
            disabled={!typeId || !brand}
            isLight={isLight}
            filter={filter}
            onChange={onModelChange}
          />
        </div>
      ) : (
        <textarea
          value={other}
          onChange={(e) => onOtherChange(e.target.value)}
          rows={3}
          placeholder={otherPlaceholder}
          className={cn(
            "w-full resize-none rounded-ona-ctl px-3.5 py-3 text-[13px] font-medium leading-snug outline-none",
            field,
          )}
        />
      )}

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onNone}
          className={cn(
            "flex w-full min-h-12 items-center rounded-ona-ctl border-0 px-3.5 py-3 text-left transition-transform duration-150 active:scale-[0.985]",
            rowCard,
          )}
        >
          <span className={cn("text-[13px] font-semibold leading-snug", ink)}>
            I don&apos;t have one yet / buying new
          </span>
        </button>
        <button
          type="button"
          onClick={onOtherMode}
          className={cn(
            "flex w-full min-h-12 items-center rounded-ona-ctl border-0 px-3.5 py-3 text-left transition-transform duration-150 active:scale-[0.985]",
            rowCard,
          )}
        >
          <span className={cn("text-[13px] font-semibold leading-snug", ink)}>
            Not listed type it
          </span>
        </button>
        {otherMode ? (
          <p
            className={cn(
              "px-1 text-[11px] font-medium",
              otherHintClassName,
              muted,
            )}
          >
            {otherHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
