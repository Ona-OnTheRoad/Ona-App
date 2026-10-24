"use client";

import { ChevronDown } from "lucide-react";
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
          <div className="relative">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 pr-10 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            >
              <option value="" disabled>
                Select a city
              </option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
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

        {/* Service Radius Slider */}
        <div className="flex flex-col gap-2.5 mt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Service radius
            </label>
            <span className="text-xs font-bold text-[#FF6B35]">
              {serviceRadiusKm} km
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
            />
          </div>
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
