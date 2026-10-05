"use client";

import { Loader2 } from "lucide-react";
import { FlatSelect } from "@/components/shop/flat-select";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

export function VehicleSelectForm({
  isLight,
  isAuthenticated,
  typeSlug,
  makeId,
  modelId,
  year,
  typeOptions,
  makeOptions,
  modelOptions,
  yearOptions,
  setTypeSlug,
  setMakeId,
  setModelId,
  setYear,
  msg,
  busy,
  applyVehicle,
}: {
  isLight: boolean;
  isAuthenticated: boolean;
  typeSlug: string;
  makeId: string;
  modelId: string;
  year: number | "";
  typeOptions: Option[];
  makeOptions: Option[];
  modelOptions: Option[];
  yearOptions: Option[];
  setTypeSlug: (v: string) => void;
  setMakeId: (v: string) => void;
  setModelId: (v: string) => void;
  setYear: (v: number | "") => void;
  msg: string | null;
  busy: boolean;
  applyVehicle: (save: boolean) => Promise<void>;
}) {
  return (
    <div className="border-0 p-0 shadow-none ring-0" data-om-vehicles-form="1">
      <p
        className={cn(
          "text-[13px] font-black",
          isLight ? "text-slate-900" : "text-white",
        )}
      >
        Select vehicle
      </p>
      <div className="mt-2 flex flex-col gap-2">
        <FlatSelect
          isLight={isLight}
          aria-label="Vehicle type"
          value={typeSlug}
          options={typeOptions}
          onChange={setTypeSlug}
        />
        <FlatSelect
          isLight={isLight}
          aria-label="Make"
          value={makeId}
          options={makeOptions}
          placeholder="Make"
          onChange={setMakeId}
        />
        <FlatSelect
          isLight={isLight}
          aria-label="Model"
          value={modelId}
          options={modelOptions}
          placeholder="Model"
          disabled={!makeId}
          onChange={setModelId}
        />
        <FlatSelect
          isLight={isLight}
          aria-label="Year"
          value={year === "" ? "" : String(year)}
          options={yearOptions}
          placeholder="Year (optional)"
          disabled={!modelId}
          onChange={(v) => setYear(v ? Number(v) : "")}
        />
      </div>
      {msg ? (
        <p className="mt-2 text-[12px] font-semibold text-red-500">{msg}</p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy || !makeId || !modelId}
          onClick={() => void applyVehicle(false)}
          className="h-11 flex-1 rounded-md border-0 text-[13px] font-bold text-white shadow-none outline-none ring-0 disabled:opacity-50"
          style={{
            backgroundColor: "#FF6B35",
            backgroundImage: "none",
            border: "none",
            boxShadow: "none",
          }}
        >
          Browse ALL PARTS
        </button>
        {isAuthenticated ? (
          <button
            type="button"
            disabled={busy || !makeId || !modelId}
            onClick={() => void applyVehicle(true)}
            className={cn(
              "h-11 flex-1 rounded-md border-0 text-[13px] font-bold shadow-none outline-none ring-0 disabled:opacity-50",
              isLight ? "text-slate-900" : "text-white",
            )}
            style={{
              backgroundColor: isLight ? "#d8d9dd" : "#3a3a3c",
              backgroundImage: "none",
              border: "none",
              boxShadow: "none",
            }}
          >
            {busy ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Save & browse"
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
