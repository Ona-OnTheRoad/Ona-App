"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toastSuccess } from "@/lib/toast";
import {
  LocationPickerMap,
  type PickedLocation,
} from "@/components/map/location-picker-map";
import { navigateBack } from "@/lib/navigation";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import {
  loadAddresses,
  saveAddresses,
  type AddressLabel,
  type SavedAddress,
} from "./saved-addresses";

/**
 * Customer: service pin + labeled saved addresses (Home / Work / Other).
 * Pro: service area pin (coverage radius lives under Availability).
 */
export default function SettingsLocationPage() {
  const router = useRouter();
  const {
    location,
    setManualLocation,
    accountType,
    userProfile,
    backendUserId,
  } = useApp();
  const t = useT();
  const isPro = accountType === "professional";
  const uid = backendUserId || userProfile?.email || "guest";
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [label, setLabel] = useState<AddressLabel>("Home");
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    setAddresses(loadAddresses(uid));
  }, [uid]);

  const value = useMemo(
    () => ({
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
      label: location.label || "",
      city: "",
      area: "",
    }),
    [location.coordinates.lat, location.coordinates.lng, location.label],
  );

  const onChange = (loc: PickedLocation) => {
    setManualLocation(loc.label || `${loc.area}, ${loc.city}`, {
      lat: loc.lat,
      lng: loc.lng,
    });
    toastSuccess(t("location.saved"));
  };

  const addSavedAddress = () => {
    if (!location.label?.trim()) return;
    const entry: SavedAddress = {
      id: `${Date.now()}`,
      label,
      customLabel: label === "Other" ? customLabel.trim() || "Other" : undefined,
      text: location.label,
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
    };
    const next = [entry, ...addresses.filter((a) => a.id !== entry.id)];
    setAddresses(next);
    saveAddresses(uid, next);
    toastSuccess("Address saved");
  };

  const removeAddress = (id: string) => {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    saveAddresses(uid, next);
  };

  const applySavedAddress = (a: SavedAddress) => {
    setManualLocation(a.text, { lat: a.lat, lng: a.lng });
    toastSuccess(t("location.saved"));
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto flex min-h-full flex-col px-4 pb-8 pt-3">
        {/* Back arrow */}
        <div className="flex items-center mb-3">
          <button
            type="button"
            onClick={() =>
              navigateBack(
                router,
                isPro ? "/settings/sections/availability" : "/settings",
                accountType,
              )
            }
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
          {isPro ? "Service area" : "Addresses & location"}
        </h1>
        <p className="mt-1 text-[13px] text-ona-muted mb-4">
          {isPro
            ? "Set your base location. Coverage radius is under Availability"
            : location.label || "Service pin & saved places"}
        </p>

        {/* Map Picker Component */}
        <div className="w-full overflow-hidden rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent shadow-xs">
          <LocationPickerMap value={value} onChange={onChange} />
        </div>

        {/* Customer Saved Addresses Section */}
        {!isPro ? (
          <div className="mt-5 space-y-3 rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 shadow-2xs">
            <p className="text-[13px] font-bold text-ona-ink">Save current pin as</p>
            <div className="flex flex-wrap gap-1.5">
              {(["Home", "Work", "Other"] as AddressLabel[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLabel(l)}
                  className={`rounded-ona-ctl border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    label === l
                      ? "border-[#ea580c] bg-ona-brand-soft text-[#ea580c]"
                      : "border-ona-border bg-ona-field text-ona-muted"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {label === "Other" && (
              <input
                className="h-10 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-3 text-[13px] text-ona-ink outline-none placeholder:text-ona-muted"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Label (e.g. Mum’s house)"
              />
            )}

            <button
              type="button"
              onClick={addSavedAddress}
              disabled={!location.label?.trim()}
              className="flex h-10 w-full items-center justify-center rounded-ona-card bg-[#ea580c] hover:bg-[#d94e08] text-[13px] font-bold text-white disabled:opacity-50 transition cursor-pointer"
            >
              Save labeled address
            </button>

            {addresses.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-ona-border dark:border-[#18181B] pt-3">
                {addresses.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-ona-ctl border border-ona-border bg-ona-field p-2.5"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[12px] font-bold text-ona-ink">
                        {a.label === "Other" ? a.customLabel || "Other" : a.label}
                      </p>
                      <p className="text-[11px] text-ona-muted truncate">{a.text}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="text-[11px] font-bold text-brand hover:underline"
                        onClick={() => applySavedAddress(a)}
                      >
                        Use
                      </button>
                      <button
                        type="button"
                        className="text-[11px] font-bold text-red-500 hover:underline"
                        onClick={() => removeAddress(a.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
