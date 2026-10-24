"use client";

import { useCallback, useId, useMemo } from "react";
import { SheetSelect, type SheetOption } from "@/components/ui/option-sheet";
import {
  filterOptions,
  getAllMakes,
  getModelsForMake,
  getYearsForMakeModel,
} from "@/lib/vehicle-catalog";
import { VEHICLE_TYPES } from "@/lib/vehicle-focus/vehicle-types";
import { cn } from "@/lib/utils";
import { cascadePlaceholders, ONA_CASCADE } from "./vehicle-cascade-ona";

type Props = {
  make: string;
  model: string;
  year: string;
  onMakeChange: (v: string) => void;
  onModelChange: (v: string) => void;
  onYearChange: (v: string) => void;
  variant?: "auth" | "profile" | "ona";
  isLight?: boolean;
  className?: string;
  makeLabel?: string;
  vehicleType?: string;
  onVehicleTypeChange?: (v: string) => void;
  powertrain?: string;
  onPowertrainChange?: (v: string) => void;
};

export const VEHICLE_POWERTRAINS = ["Petrol", "Diesel", "Hybrid", "Electric"];

function SearchSelect({
  label,
  required,
  value,
  placeholder,
  options,
  disabled,
  onChange,
  variant,
  isLight,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange: (v: string) => void;
  variant: "auth" | "profile" | "ona";
  isLight?: boolean;
}) {
  const id = useId();
  const sheetOptions = useMemo<SheetOption[]>(
    () => options.map((o) => ({ value: o, label: o })),
    [options],
  );
  const filterFn = useCallback((all: SheetOption[], query: string) => {
    const byLabel = new Map(all.map((o) => [o.label, o]));
    return filterOptions(
      all.map((o) => o.label),
      query,
      all.length,
    )
      .map((l) => byLabel.get(l))
      .filter((o): o is SheetOption => o != null);
  }, []);

  const fieldClass =
    variant === "ona"
      ? undefined
      : variant === "auth"
        ? "om-auth-field h-10 w-full rounded-md border !border-[#9A9EA6] !bg-[#E2E3E7] px-3 text-[13px] font-medium !text-[#0f172a]"
        : isLight
          ? "h-11 w-full rounded-md border-0 bg-black/8 px-3 text-[14px] font-medium text-slate-900"
          : "h-11 w-full rounded-md border-0 bg-[#2c2c2e] px-3 text-[14px] font-medium text-white";

  const labelClass =
    variant === "ona"
      ? ONA_CASCADE.label
      : variant === "auth"
        ? "mb-0.5 block text-[11px] font-semibold text-[#475569]"
        : isLight
          ? "mb-1 block text-[12px] font-semibold text-slate-700"
          : "mb-1 block text-[12px] font-semibold text-white/70";

  return (
    <div className="relative block">
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && variant !== "ona" ? (
          <span className="ml-0.5 font-bold text-red-600" aria-label="required">
            *
          </span>
        ) : null}
      </label>
      <SheetSelect
        id={id}
        bare={variant !== "ona"}
        title={label}
        value={value}
        options={sheetOptions}
        placeholder={placeholder}
        disabled={disabled}
        filterFn={filterFn}
        className={cn(fieldClass, disabled && "cursor-not-allowed opacity-55")}
        chevronClassName={variant === "ona" ? undefined : "text-slate-500"}
        onChange={onChange}
      />
    </div>
  );
}

export function VehicleCascadeFields({
  make,
  model,
  year,
  onMakeChange,
  onModelChange,
  onYearChange,
  variant = "auth",
  isLight = true,
  className,
  makeLabel = "Make",
  vehicleType,
  onVehicleTypeChange,
  powertrain,
  onPowertrainChange,
}: Props) {
  const makes = useMemo(() => getAllMakes(), []);
  const models = useMemo(() => (make ? getModelsForMake(make) : []), [make]);
  const years = useMemo(
    () => (make && model ? getYearsForMakeModel(make, model).map(String) : []),
    [make, model],
  );
  const vehicleTypes = useMemo(
    () => VEHICLE_TYPES.filter((t) => t.toLowerCase() !== "any"),
    [],
  );

  const ph = cascadePlaceholders(variant, make, model);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {onVehicleTypeChange ? (
        <SearchSelect
          label="Vehicle"
          value={vehicleType || ""}
          placeholder="Search vehicle type"
          options={vehicleTypes}
          variant={variant}
          isLight={isLight}
          onChange={onVehicleTypeChange}
        />
      ) : null}
      <SearchSelect
        label={makeLabel}
        required
        value={make}
        placeholder="Search make (e.g. Toyota)"
        options={makes}
        variant={variant}
        isLight={isLight}
        onChange={(v) => {
          onMakeChange(v);
          onModelChange("");
          onYearChange("");
        }}
      />
      <SearchSelect
        label="Model"
        required
        value={model}
        placeholder={ph.model}
        options={models}
        disabled={!make}
        variant={variant}
        isLight={isLight}
        onChange={(v) => {
          onModelChange(v);
          onYearChange("");
        }}
      />
      <SearchSelect
        label="Year"
        value={year}
        placeholder={ph.year}
        options={years}
        disabled={!make || !model}
        variant={variant}
        isLight={isLight}
        onChange={onYearChange}
      />
      {onPowertrainChange ? (
        <SearchSelect
          label="Power / Fuel"
          value={powertrain || ""}
          placeholder="Petrol, Diesel, Hybrid or Electric"
          options={VEHICLE_POWERTRAINS}
          variant={variant}
          isLight={isLight}
          onChange={onPowertrainChange}
        />
      ) : null}
    </div>
  );
}
