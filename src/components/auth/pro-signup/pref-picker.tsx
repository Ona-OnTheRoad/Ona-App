import { Check, ChevronLeft } from "lucide-react";
import { AuthPlate } from "@/components/auth/auth-plate";
import { cn } from "@/lib/utils";
import type { PrefKey } from "@/lib/vehicle-focus";
import { optionsForPref } from "@/lib/vehicle-focus";
import { MAX_BRANDS } from "./constants";
import type { ProFieldStyles } from "./field-styles";
import type { VehicleFocus } from "./use-vehicle-focus";

/* Full-page skill picker (same AuthPlate background + enter/exit motion) */
export function PrefPicker({
  exiting,
  pickerKey,
  focus,
  styles,
}: {
  exiting: boolean;
  pickerKey: PrefKey;
  focus: VehicleFocus;
  styles: ProFieldStyles;
}) {
  const {
    vehicleBrands,
    vehicleType,
    prefCountry,
    pickerQuery,
    prefValue,
    pickerLabel,
    modelsFor,
    toggleModelForBrand,
    toggleBrand,
    setPrefValue,
    closePicker,
    setPickerQuery,
  } = focus;
  const isVehicleType = pickerKey === "vehicleType";
  const isBrand = pickerKey === "brand";
  const isModel = pickerKey === "model";
  const q = pickerQuery.trim().toLowerCase();

  const filterOpts = (opts: string[]) =>
    opts.filter((opt) => !q || opt.toLowerCase().includes(q));

  const singleBrandForModel = vehicleBrands[0] || "Any";
  const modelBrands =
    vehicleBrands.length > 0 ? vehicleBrands : (["Any"] as string[]);

  const singleOptions =
    !isModel || vehicleBrands.length <= 1
      ? filterOpts(
          optionsForPref(
            pickerKey,
            vehicleType,
            isModel ? singleBrandForModel : vehicleBrands[0] || "Any",
            prefCountry,
          ),
        )
      : [];

  const optionBtn = (
    opt: string,
    selected: boolean,
    onPick: () => void,
    disabled?: boolean,
  ) => (
    <button
      type="button"
      key={opt}
      disabled={disabled}
      onClick={onPick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border-0 px-2 text-left transition-colors",
        isVehicleType ? "py-1.5" : "py-2",
        selected
          ? "bg-[#FF6B35]/18 text-[#9a3412] ring-1 ring-[#FF6B35]/45"
          : "bg-transparent text-[#1e293b] active:bg-black/[0.04]",
        disabled && "opacity-40",
      )}
    >
      <span
        className={cn(
          "min-w-0 flex-1 font-semibold uppercase leading-snug tracking-[0.01em]",
          isVehicleType || isModel ? "text-[11px]" : "text-[13px]",
          selected ? "text-[#9a3412]" : "text-[#1e293b]",
        )}
      >
        {opt}
      </span>
      {selected && (
        <Check
          className="h-3.5 w-3.5 shrink-0 text-[#FF6B35]"
          strokeWidth={2.5}
        />
      )}
    </button>
  );

  const modelColumn = (brand: string) => {
    const opts = filterOpts(
      optionsForPref("model", vehicleType, brand, prefCountry),
    );
    const chosen = modelsFor(brand);
    return (
      <div
        key={brand}
        className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-black/10 bg-white/40"
      >
        <p className="shrink-0 border-b border-black/10 px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-[#475569]">
          {brand}
          <span className="mt-0.5 block text-[10px] font-medium normal-case tracking-normal text-[#475569]">
            {chosen.filter((m) => m !== "Any").length || chosen.includes("Any")
              ? `${chosen.length} selected`
              : "Tap models"}
          </span>
        </p>
        <ul className="min-h-0 flex-1 list-none space-y-0.5 overflow-y-auto overscroll-contain p-1 scrollbar-hide">
          {opts.map((opt) =>
            optionBtn(opt, chosen.includes(opt), () =>
              toggleModelForBrand(brand, opt),
            ),
          )}
          {opts.length === 0 && (
            <li className="py-4 text-center text-[11px] text-[#475569]">
              No matches
            </li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <AuthPlate exiting={exiting}>
      <div className="om-pro-signup-fields flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3">
        <div className="relative flex items-center justify-center pb-0.5">
          <button
            type="button"
            onClick={closePicker}
            className="absolute left-0 inline-flex h-8 items-center gap-0.5 rounded-md border-0 bg-transparent px-0 text-[12px] font-semibold text-[#1e293b]"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
            Back
          </button>
          <h1 className="text-[15px] font-bold tracking-tight text-[#1c1c1e]">
            {isBrand
              ? "Car brands (up to 2)"
              : isModel
                ? "Models"
                : pickerLabel}
          </h1>
        </div>

        {isBrand && (
          <p className="mt-1 text-center text-[11px] text-[#475569]">
            Selected {vehicleBrands.length}/{MAX_BRANDS}. Tap to add or remove.
          </p>
        )}
        {isModel && vehicleBrands.length > 0 && (
          <p className="mt-1 text-center text-[11px] text-[#475569]">
            Full list per brand. Pick as many models as you like, then Done.
          </p>
        )}
        {isModel && vehicleBrands.length === 0 && (
          <p className="mt-1 text-center text-[11px] text-[#475569]">
            Pick brands first, then choose models.
          </p>
        )}

        <div className="mt-2">
          <input
            type="search"
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search"
            className={styles.fieldClass}
            style={styles.fieldStyle}
            autoFocus
          />
        </div>

        {/* Two brands: side-by-side full model catalogs, multi-select */}
        {isModel && vehicleBrands.length >= 1 ? (
          <div
            className={cn(
              "mt-1.5 min-h-0 flex-1 gap-2",
              vehicleBrands.length > 1 ? "grid grid-cols-2" : "flex flex-col",
            )}
          >
            {modelBrands.map((brand) => modelColumn(brand))}
          </div>
        ) : (
          <ul className="mt-1.5 min-h-0 flex-1 list-none space-y-1 overflow-y-auto overscroll-contain scrollbar-hide">
            {singleOptions.map((opt) => {
              const selected = isBrand
                ? vehicleBrands.includes(opt)
                : prefValue[pickerKey] === opt;
              const brandFull =
                isBrand && !selected && vehicleBrands.length >= MAX_BRANDS;
              return (
                <li key={opt}>
                  {optionBtn(
                    opt,
                    selected,
                    () => {
                      if (isBrand) {
                        toggleBrand(opt);
                        return;
                      }
                      setPrefValue(pickerKey, opt);
                      closePicker();
                    },
                    brandFull,
                  )}
                </li>
              );
            })}
            {singleOptions.length === 0 && (
              <li className="py-8 text-center text-[12px] text-[#475569]">
                {isModel && vehicleBrands.length === 0
                  ? "Pick car brands first"
                  : "No matches"}
              </li>
            )}
          </ul>
        )}

        {(isBrand || isModel) && (
          <button
            type="button"
            className="om-cta-dark-gray mt-2"
            onClick={closePicker}
            disabled={isModel && vehicleBrands.length === 0}
          >
            Done
          </button>
        )}
      </div>
    </AuthPlate>
  );
}
