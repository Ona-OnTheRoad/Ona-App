import { useState } from "react";
import type { PrefKey } from "@/lib/vehicle-focus";
import {
  PREF_ROWS,
  optionsForPref,
  syncBrandForVehicleType,
  syncLocationForCountry,
} from "@/lib/vehicle-focus";
import { MAX_BRANDS } from "./constants";

/** Service focus: type, up to 2 brands, many models per brand, country, location */
export function useVehicleFocus() {
  const [vehicleType, setVehicleType] = useState("Automobile / Passenger Car");
  const [vehicleBrands, setVehicleBrands] = useState<string[]>([]);
  /** Models chosen for each brand (multi-select, no cap) */
  const [vehicleModelsByBrand, setVehicleModelsByBrand] = useState<
    Record<string, string[]>
  >({});
  const [prefCountry, setPrefCountry] = useState("Nigeria");
  const [prefLocation, setPrefLocation] = useState("Any");
  const [pickerKey, setPickerKey] = useState<PrefKey | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");

  const brandLabel =
    vehicleBrands.length === 0 ? "Pick up to 2" : vehicleBrands.join(", ");

  const modelsFor = (brand: string) =>
    vehicleModelsByBrand[brand]?.length
      ? vehicleModelsByBrand[brand]
      : (["Any"] as string[]);

  const modelLabel =
    vehicleBrands.length === 0
      ? "Pick brands first"
      : vehicleBrands
          .map((b) => {
            const list = modelsFor(b);
            const modelsText = list.join(", ");
            return vehicleBrands.length > 1
              ? `${b}: ${modelsText}`
              : modelsText;
          })
          .join(" · ");

  const prefValue: Record<PrefKey, string> = {
    vehicleType,
    brand: brandLabel,
    model: modelLabel,
    country: prefCountry,
    location: prefLocation,
  };

  /** Toggle a model under a brand (unlimited multi-select). */
  const toggleModelForBrand = (brand: string, model: string) => {
    setVehicleModelsByBrand((prev) => {
      const cur = prev[brand] ?? [];
      if (model === "Any") {
        return { ...prev, [brand]: ["Any"] };
      }
      const withoutAny = cur.filter((m) => m !== "Any");
      if (withoutAny.includes(model)) {
        const next = withoutAny.filter((m) => m !== model);
        return { ...prev, [brand]: next.length ? next : ["Any"] };
      }
      return { ...prev, [brand]: [...withoutAny, model] };
    });
  };

  const toggleBrand = (value: string) => {
    setVehicleBrands((prev) => {
      if (prev.includes(value)) {
        const next = prev.filter((b) => b !== value);
        setVehicleModelsByBrand((models) => {
          const copy = { ...models };
          delete copy[value];
          return copy;
        });
        return next;
      }
      if (prev.length >= MAX_BRANDS) return prev;
      if (value === "Any") {
        setVehicleModelsByBrand({ Any: ["Any"] });
        return ["Any"];
      }
      const withoutAny = prev.filter((b) => b !== "Any");
      const next = [...withoutAny, value];
      setVehicleModelsByBrand((models) => {
        const cleaned = { ...models };
        delete cleaned.Any;
        return {
          ...cleaned,
          [value]: models[value]?.length ? models[value] : ["Any"],
        };
      });
      return next;
    });
  };

  const setPrefValue = (key: PrefKey, value: string) => {
    if (key === "vehicleType") {
      setVehicleType(value);
      const synced = vehicleBrands
        .map((b) => syncBrandForVehicleType(value, b))
        .filter((b, i, arr) => arr.indexOf(b) === i)
        .slice(0, MAX_BRANDS);
      setVehicleBrands(synced);
      setVehicleModelsByBrand((prev) => {
        const next: Record<string, string[]> = {};
        for (const b of synced) {
          const existing = prev[b] ?? ["Any"];
          // Keep models that still exist for this brand/type
          const allowed = new Set(
            optionsForPref("model", value, b, prefCountry),
          );
          const kept = existing.filter((m) => allowed.has(m));
          next[b] = kept.length ? kept : ["Any"];
        }
        return next;
      });
      return;
    }
    if (key === "brand") {
      toggleBrand(value);
      return;
    }
    if (key === "model") {
      const b = vehicleBrands[0] || "Any";
      toggleModelForBrand(b, value);
      return;
    }
    if (key === "country") {
      setPrefCountry(value);
      setPrefLocation(syncLocationForCountry(value, prefLocation));
      return;
    }
    setPrefLocation(value);
  };

  const closePicker = () => {
    setPickerKey(null);
    setPickerQuery("");
  };

  const pickerLabel = pickerKey
    ? (PREF_ROWS.find((r) => r.key === pickerKey)?.label ?? "")
    : "";

  return {
    vehicleType,
    vehicleBrands,
    vehicleModelsByBrand,
    prefCountry,
    prefLocation,
    pickerKey,
    pickerQuery,
    setPickerQuery,
    prefValue,
    modelsFor,
    toggleModelForBrand,
    toggleBrand,
    setPrefValue,
    closePicker,
    pickerLabel,
  };
}

export type VehicleFocus = ReturnType<typeof useVehicleFocus>;
