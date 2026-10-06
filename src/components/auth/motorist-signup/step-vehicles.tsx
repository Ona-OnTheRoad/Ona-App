import {
  authSecondaryBtnClass,
  authSelectClass as selectClass,
} from "@/components/auth/auth-plate";
import { VehicleCascadeFields } from "@/components/vehicles/vehicle-cascade-fields";
import { cn } from "@/lib/utils";
import type { MotoristVehiclesState } from "./use-motorist-vehicles";

/** Step 3: optional vehicles. */
export function StepVehicles({
  v: vs,
  setFormError,
}: {
  v: MotoristVehiclesState;
  setFormError: (msg: string) => void;
}) {
  const {
    vehicles,
    setVehicles,
    draftVehicleType,
    setDraftVehicleType,
    draftMake,
    setDraftMake,
    draftModel,
    setDraftModel,
    draftYear,
    setDraftYear,
    draftReady,
    addDraftVehicle,
    vehicleTypeOptions,
  } = vs;
  return (
    <div className="flex flex-col gap-3">
      {vehicles.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {vehicles.map((v) => (
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
                  setVehicles((prev) => prev.filter((x) => x.id !== v.id))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Full catalog one-line searchable dropdowns (not full-page) */}
      <label className="block">
        <span className="mb-0.5 block text-[11px] font-semibold text-[#475569]">
          Vehicle type
        </span>
        <select
          className={selectClass}
          value={draftVehicleType}
          onChange={(e) => setDraftVehicleType(e.target.value)}
        >
          <option value="">Any / not specified</option>
          {vehicleTypeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <VehicleCascadeFields
        make={draftMake}
        model={draftModel}
        year={draftYear}
        onMakeChange={setDraftMake}
        onModelChange={setDraftModel}
        onYearChange={setDraftYear}
        variant="auth"
        isLight
      />

      <button
        type="button"
        className={cn(authSecondaryBtnClass, "text-[12px] font-semibold")}
        disabled={!draftReady}
        onClick={() => {
          if (!addDraftVehicle()) {
            setFormError("Pick make and model to add a vehicle.");
            return;
          }
          setFormError("");
        }}
      >
        + Add vehicle
      </button>
    </div>
  );
}
