import { Check, ChevronLeft } from "lucide-react";
import { AuthPlate } from "@/components/auth/auth-plate";
import type { VehiclePickerKey } from "./constants";
import type { ProFieldStyles } from "./field-styles";
import type { VehiclesCanFix } from "./use-vehicles-can-fix";

const TITLE_MAP: Record<VehiclePickerKey, string> = {
  vehicleType: "Vehicle",
  make: "Make",
  model: "Model",
  year: "Year",
};

/* Full-page vehicle cascade picker (Vehicles you fix) */
export function VehicleCascadePicker({
  exiting,
  pickerKey,
  fix,
  styles,
}: {
  exiting: boolean;
  pickerKey: VehiclePickerKey;
  fix: VehiclesCanFix;
  styles: ProFieldStyles;
}) {
  const opts = fix.vehicleOptionsFor(pickerKey);
  return (
    <AuthPlate exiting={exiting}>
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3">
        <div className="relative flex items-center justify-center pb-1">
          <button
            type="button"
            onClick={() => {
              fix.closeVehiclePicker();
            }}
            className="absolute left-0 inline-flex h-8 items-center gap-0.5 rounded-md border-0 bg-transparent px-0 text-[12px] font-semibold text-[#1e293b]"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
            Back
          </button>
          <h1 className="text-[15px] font-bold tracking-tight text-[#1c1c1e]">
            {TITLE_MAP[pickerKey]}
          </h1>
        </div>
        <div className="mt-2">
          <input
            type="search"
            value={fix.vehiclePickerQuery}
            onChange={(e) => fix.setVehiclePickerQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search"
            className={styles.fieldClass}
            style={styles.fieldStyle}
            autoFocus
          />
        </div>
        <ul className="mt-1.5 min-h-0 flex-1 list-none space-y-1 overflow-y-auto scrollbar-hide">
          {opts.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => fix.applyVehiclePick(pickerKey, opt)}
                className="flex w-full items-center justify-between rounded-md border-0 bg-white/70 px-3 py-3 text-left text-[13px] font-semibold text-[#0f172a]"
              >
                {opt}
                {(pickerKey === "vehicleType"
                  ? fix.draftVehicleType
                  : pickerKey === "make"
                    ? fix.draftMake
                    : pickerKey === "model"
                      ? fix.draftModel
                      : fix.draftYear) === opt ? (
                  <Check className="h-4 w-4 text-[#FF6B35]" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthPlate>
  );
}
