import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayVal } from "./constants";
import type { VehiclesCanFix } from "./use-vehicles-can-fix";

/** Step 3: Vehicles you fix (optional cascade list). */
export function StepVehicles({ fix }: { fix: VehiclesCanFix }) {
  const {
    vehiclesCanFix,
    setVehiclesCanFix,
    draftVehicleType,
    draftMake,
    draftModel,
    draftYear,
    draftVehicleReady,
    openVehiclePicker,
    addVehicleCanFix,
  } = fix;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] font-medium leading-snug text-[#475569]">
        Add vehicle types you fix best (type, make, model, year). Optional you
        can skip.
      </p>
      {vehiclesCanFix.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {vehiclesCanFix.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-2 rounded-md border border-[#9A9EA6]/50 bg-white/60 px-2.5 py-2 text-[12px] text-[#0f172a]"
            >
              <span className="min-w-0 flex-1 font-semibold">
                {[v.vehicleType, v.make, v.model, v.year]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <button
                type="button"
                className="shrink-0 border-0 bg-transparent text-[11px] font-semibold text-red-600"
                onClick={() =>
                  setVehiclesCanFix((prev) => prev.filter((x) => x.id !== v.id))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="overflow-hidden rounded-xl bg-[#f2f3f5] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
        {(
          [
            {
              key: "vehicleType" as const,
              label: "Vehicle",
              value: draftVehicleType,
            },
            { key: "make" as const, label: "Make", value: draftMake },
            { key: "model" as const, label: "Model", value: draftModel },
            { key: "year" as const, label: "Year", value: draftYear },
          ] as const
        ).map((row, i) => (
          <button
            key={row.key}
            type="button"
            onClick={() => openVehiclePicker(row.key)}
            className={cn(
              "flex w-full items-center justify-between gap-3 border-0 bg-transparent px-4 py-3.5 text-left",
              i > 0 && "border-t border-black/[0.06]",
            )}
          >
            <span className="text-[14px] font-semibold text-[#1e293b]">
              {row.label}
            </span>
            <span className="inline-flex min-w-0 max-w-[55%] items-center gap-1">
              <span className="truncate text-[13px] font-medium uppercase tracking-[0.02em] text-[#64748b]">
                {displayVal(row.value)}
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[#94a3b8]"
                strokeWidth={2}
              />
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!draftVehicleReady}
        onClick={addVehicleCanFix}
        className="h-11 w-full rounded-md border-0 bg-[#FF6B35] text-[13px] font-bold text-white disabled:opacity-40"
      >
        Add vehicle
      </button>
    </div>
  );
}
