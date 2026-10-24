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
    <div className="flex flex-col flex-1 px-5 pt-4 pb-6 bg-ona-bg text-ona-ink">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ona-ink tracking-tight">
          Where are you based?
        </h1>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-5 flex-1">
        {/* City Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            City
          </label>
          <SheetSelect
            bare
            title="City"
            value={city}
            onChange={(v) => setCity(v)}
            placeholder="Select a city"
            options={CITIES.map((c) => ({ value: String(c), label: c }))}
            className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            chevronClassName="right-3.5 text-ona-muted"
          />
        </div>

        {/* Area Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ona-ink">
            Area
          </label>
          <div className="relative">
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Yaba, Lekki"
              className="w-full bg-ona-field border border-ona-border rounded-xl px-3.5 py-3 text-sm text-ona-ink placeholder:text-ona-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
        </div>

        {/* Service Radius Slider Card with active orange fill */}
        <div className="rounded-2xl border border-ona-border bg-ona-surface p-4 shadow-sm flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ona-ink">
              Service radius
            </span>
            <span className="text-sm font-bold text-brand">
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
            <Slider.Track className="bg-ona-border relative grow rounded-full h-2 overflow-hidden">
              <Slider.Range className="absolute bg-brand rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-6 h-6 bg-white dark:bg-ona-surface shadow-md border border-ona-border rounded-full focus:outline-none focus:ring-2 focus:ring-brand/30 transition-transform active:scale-110 cursor-pointer"
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
          className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer ${
            isValid
              ? "bg-brand hover:opacity-90 text-white active:scale-[0.99]"
              : "bg-brand/50 text-white cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
