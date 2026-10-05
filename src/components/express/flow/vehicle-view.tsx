import { ChevronRight } from "lucide-react";
import { formatVehicleLabel } from "@/components/home/job-vehicle-step";
import { VehicleCascadeFields } from "@/components/vehicles/vehicle-cascade-fields";
import { cn } from "@/lib/utils";
import { actionFlat, PINNED_BOTTOM, PRIMARY_BTN } from "./helpers";
import type { ExpressTheme } from "./types";
import type { useExpressVehicles } from "./use-express-vehicles";

type Vehicles = ReturnType<typeof useExpressVehicles>;

type Props = {
  theme: ExpressTheme;
  vehicles: Vehicles;
  error: string | null;
};

export function VehicleView({ theme, vehicles: vs, error }: Props) {
  const { isLight, ink, rowCard } = theme;
  const { draft } = vs;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pt-2">
      {vs.savedVehicles.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {vs.savedVehicles.map((v) => {
            const label = formatVehicleLabel(v);
            const selected = vs.selectedVehicleId === (v.id ?? label);
            return (
              <li key={v.id ?? label}>
                <button
                  type="button"
                  onClick={() => vs.selectVehicle(label)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-[4px] border-0 px-2.5 py-3 text-left transition-transform active:scale-[0.985]",
                    selected ? "bg-[#FF6B35]/10" : rowCard,
                  )}
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-[13px] font-semibold",
                      selected ? "text-[#FF6B35]" : ink,
                    )}
                  >
                    {label}
                  </span>
                  {selected ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#FF6B35]" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* "+ Add vehicle" reveals the cascade form inline (registration style) */}
      {vs.showVehicleForm ? (
        <div className={cn("rounded-[4px] px-3 py-3", rowCard)}>
          <VehicleCascadeFields
            make={draft.make}
            model={draft.model}
            year={draft.year}
            onMakeChange={(v) => {
              draft.setMake(v);
              vs.setSelectedVehicleId(null);
            }}
            onModelChange={(v) => {
              draft.setModel(v);
              vs.setSelectedVehicleId(null);
            }}
            onYearChange={draft.setYear}
            vehicleType={draft.vehicleType}
            onVehicleTypeChange={(v) => {
              draft.setVehicleType(v);
              vs.setSelectedVehicleId(null);
            }}
            variant="profile"
            isLight={isLight}
          />
        </div>
      ) : null}

      {/* Vehicle-form actions pinned to the bottom */}
      {vs.showVehicleForm ? (
        <div className={PINNED_BOTTOM}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={vs.cancelForm}
              className={cn(
                "h-10 flex-1 rounded-md border-0 text-[12px] font-semibold",
                actionFlat(isLight),
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!draft.make.trim() || !draft.model.trim()}
              onClick={vs.saveVehicle}
              className="h-10 flex-1 rounded-md border-0 bg-brand text-[12px] font-bold text-white disabled:opacity-50"
            >
              Save vehicle
            </button>
          </div>
        </div>
      ) : null}
      {vs.showVehicleForm ? null : (
        <div className={PINNED_BOTTOM}>
          <button
            type="button"
            onClick={vs.openForm}
            className={cn(
              "flex w-full items-center justify-center gap-1 rounded-[4px] border-0 px-3 py-3.5 text-left transition-transform active:scale-[0.985]",
              rowCard,
            )}
          >
            <span className={cn("text-[13px] font-bold", ink)}>
              + Add vehicle
            </span>
          </button>
        </div>
      )}

      {vs.pendingContinue ? (
        <div className={PINNED_BOTTOM}>
          <button
            type="button"
            onClick={vs.continuePending}
            className={PRIMARY_BTN}
          >
            Continue
          </button>
          {error ? (
            <p className="mt-1 text-center text-[12px] font-semibold text-red-500">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
