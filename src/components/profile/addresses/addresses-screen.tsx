"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddressMapCard } from "./address-map-card";
import { AddressSearchBar } from "./address-search-bar";
import { SavePinCard } from "./save-pin-card";
import {
  SavedAddressesCard,
  type SavedAddressItem,
} from "./saved-addresses-card";
import { reverseGeocodeLatLng } from "@/lib/google-maps";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { toastSuccess } from "@/lib/toast";

const STORAGE_KEY = "ona-saved-addresses-v1";

const DEFAULT_ADDRESSES: SavedAddressItem[] = [
  {
    id: "home-default",
    label: "Home",
    address: "Lagos, Nigeria",
    lat: 6.5186,
    lng: 3.3886,
    isActive: true,
  },
  {
    id: "other-default",
    label: "Other",
    address: "Lagos, Nigeria",
    lat: 6.5244,
    lng: 3.3792,
    isActive: false,
  },
  {
    id: "work-default",
    label: "Work",
    address: "Lagos, Nigeria",
    lat: 6.4531,
    lng: 3.3958,
    isActive: false,
  },
];

export function AddressesScreen() {
  const router = useRouter();
  const {
    accountType,
    userProfile,
    updateUserProfile,
    setManualLocation,
    location,
    backendUserId,
  } = useApp();

  const uid = backendUserId || userProfile?.email || "guest";

  // Coordinates of current pin on the map
  const [pin, setPin] = useState<{ lat: number; lng: number }>(() => {
    if (location?.coordinates?.lat && location?.coordinates?.lng) {
      return {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
      };
    }
    return { lat: 6.5186, lng: 3.3886 };
  });

  const [searchQuery, setSearchQuery] = useState(
    location?.label || location?.city || "Yaba, Lagos",
  );
  const [isLocating, setIsLocating] = useState(false);
  const [activeId, setActiveId] = useState<string>("home-default");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize saved addresses
  const [addresses, setAddresses] = useState<SavedAddressItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`${STORAGE_KEY}:${uid}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    if (userProfile?.savedLocations && userProfile.savedLocations.length > 0) {
      return userProfile.savedLocations.map((item, index) => ({
        ...item,
        isActive: index === 0,
      }));
    }
    return DEFAULT_ADDRESSES;
  });

  // Sync to localStorage and backend
  const persistAddresses = async (list: SavedAddressItem[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`${STORAGE_KEY}:${uid}`, JSON.stringify(list));
      } catch {
        /* ignore */
      }
    }
    try {
      await updateUserProfile({
        savedLocations: list.map(({ id, label, address, lat, lng }) => ({
          id,
          label,
          address,
          lat,
          lng,
        })),
      });
    } catch {
      /* handled */
    }
  };

  const handleBack = () => {
    navigateBack(router, "/profile", accountType);
  };

  // Called when user clicks or drags the pin on the map
  const handlePinChange = async (lat: number, lng: number) => {
    setPin({ lat, lng });
    try {
      const res = await reverseGeocodeLatLng(lat, lng);
      if (res?.label) {
        setSearchQuery(res.label);
        setManualLocation(res.label, { lat, lng });
      } else {
        const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setSearchQuery(fallback);
        setManualLocation(fallback, { lat, lng });
      }
    } catch {
      /* ignore */
    }
  };

  // Called when user selects a place from search dropdown or hits Enter
  const handleSelectPlace = (place: { label: string; lat: number; lng: number }) => {
    setPin({ lat: place.lat, lng: place.lng });
    setSearchQuery(place.label);
    setManualLocation(place.label, { lat: place.lat, lng: place.lng });
  };

  // Called when user taps the GPS locate button
  const handleLocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPin({ lat, lng });

        try {
          const res = await reverseGeocodeLatLng(lat, lng);
          const detectedLabel = res?.label || "Current Location, Lagos";
          setSearchQuery(detectedLabel);
          setManualLocation(detectedLabel, { lat, lng });
          toastSuccess("Location detected");
        } catch {
          setSearchQuery("Current Location, Lagos");
          setManualLocation("Current Location, Lagos", { lat, lng });
          toastSuccess("Location detected");
        }
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Called when saving current pin under Home, Work, or Custom label
  const handleSavePin = async (finalLabel: string) => {
    setIsSaving(true);
    const newId = `addr-${Date.now()}`;
    const newAddr: SavedAddressItem = {
      id: newId,
      label: finalLabel,
      address: searchQuery || "Lagos, Nigeria",
      lat: pin.lat,
      lng: pin.lng,
      isActive: true,
    };

    // Deactivate previous active items
    const nextList = [
      newAddr,
      ...addresses.filter((a) => a.label !== finalLabel).map((a) => ({ ...a, isActive: false })),
    ];

    setAddresses(nextList);
    setActiveId(newId);
    setManualLocation(finalLabel, { lat: pin.lat, lng: pin.lng });

    await persistAddresses(nextList);
    setIsSaving(false);
    toastSuccess(`Saved "${finalLabel}" address`);
  };

  // Called when tapping "Use" on a saved address
  const handleUse = (id: string) => {
    const target = addresses.find((a) => a.id === id);
    if (!target) return;

    setActiveId(id);
    setPin({ lat: target.lat, lng: target.lng });
    setSearchQuery(target.address);
    setManualLocation(target.label, { lat: target.lat, lng: target.lng });

    const nextList = addresses.map((a) => ({
      ...a,
      isActive: a.id === id,
    }));
    setAddresses(nextList);
    void persistAddresses(nextList);
    toastSuccess(`Switched active address to ${target.label}`);
  };

  // Called when tapping "Delete" on a saved address
  const handleDelete = async (id: string) => {
    const nextList = addresses.filter((a) => a.id !== id);
    setAddresses(nextList);
    if (activeId === id && nextList.length > 0) {
      setActiveId(nextList[0].id);
    }
    await persistAddresses(nextList);
    toastSuccess("Address deleted");
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-3.5">
        {/* Header */}
        <div className="pt-2 pb-0.5">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 -ml-2 items-center justify-center rounded-full text-ona-ink hover:bg-ona-field transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>

          <h1 className="mt-2.5 text-[20px] font-semibold text-ona-ink tracking-tight">
            Addresses &amp; location
          </h1>
        </div>

        {/* Interactive Search Bar with Autocomplete Suggestions */}
        <AddressSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onLocate={handleLocate}
          onSelectPlace={handleSelectPlace}
          isLocating={isLocating}
        />

        {/* Live Interactive Map with Draggable / Clickable Red Pin */}
        <AddressMapCard pin={pin} onPinChange={handlePinChange} />

        {/* Save Current Pin Section */}
        <SavePinCard onSave={handleSavePin} isSaving={isSaving} />

        {/* Saved Addresses Card */}
        <SavedAddressesCard
          addresses={addresses}
          activeId={activeId}
          onUse={handleUse}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
