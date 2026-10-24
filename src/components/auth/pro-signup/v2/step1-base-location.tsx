"use client";

import { SheetSelect } from "@/components/ui/option-sheet";
import * as Slider from "@radix-ui/react-slider";
import { NG_STATES } from "@/lib/artisan/catalog/locations";

interface Step1BaseLocationProps {
  city: string;
  setCity: (city: string) => void;
  area: string;
  setArea: (area: string) => void;
  serviceRadiusKm: number;
  setServiceRadiusKm: (radius: number) => void;
  onContinue: () => void;
}

const CITIES = [
  "Lagos",
  "Abuja (FCT)",
  "Port Harcourt",
  "Ibadan",
  "Benin City",
  "Kano",
  "Kaduna",
  "Enugu",
  "Abeokuta",
  "Asaba",
  "Warri",
  "Calabar",
  "Owerri",
  ...NG_STATES.filter(
    (s) =>
      ![
        "Lagos",
        "Abuja (FCT)",
        "Ogun",
        "Oyo",
        "Rivers",
        "Kano",
        "Kaduna",
        "Enugu",
        "Delta",
        "Edo",
      ].includes(s),
  ),
];

export function Step1BaseLocation({
  city,
  setCity,
  area,
  setArea,
  serviceRadiusKm,
  setServiceRadiusKm,
  onContinue,
}: Step1BaseLocationProps) {
  const isValid = city.trim().length > 0 && area.trim().length > 0;

  return (
    <div className="flex flex-col flex-1 px-5 pt-4 pb-6 bg-white dark:bg-[#121316]">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Where are you based?
        </h1>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-5 flex-1">
        {/* City Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            City
          </label>
          <SheetSelect
            bare
            title="City"
            value={city}
            onChange={(v) => setCity(v)}
            placeholder="Select a city"
            options={CITIES.map((c) => ({ value: String(c), label: c }))}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            chevronClassName="right-3.5 text-slate-400"
          />
        </div>

        {/* Area Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Area
          </label>
          <div className="relative">
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Yaba, Lekki"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            />
          </div>
        </div>

        {/* Service Radius Slider Card with active orange fill */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Service radius
            </span>
            <span className="text-sm font-bold text-[#c2410c] dark:text-[#FF6B35]">
              {serviceRadiusKm} km
            </span>
          </div>

          <Slider.Root
            value={[serviceRadiusKm]}
            onValueChange={([val]) => setServiceRadiusKm(val)}
            min={1}
            max={50}
            step={1}
            aria-label="Service radius"
            className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
          >
            <Slider.Track className="bg-slate-200/90 dark:bg-slate-700 relative grow rounded-full h-2 overflow-hidden">
              <Slider.Range className="absolute bg-[#ea580c] dark:bg-[#FF6B35] rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-6 h-6 bg-white shadow-md border border-slate-200/80 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 transition-transform active:scale-110"
              aria-label="Radius value"
            />
          </Slider.Root>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm ${
            isValid
              ? "bg-[#FF6B35] hover:bg-[#e85a26] text-white active:scale-[0.99]"
              : "bg-[#FF6B35]/50 text-white cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
