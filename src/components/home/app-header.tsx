"use client";

import { LocateFixed, MapPin } from "lucide-react";
import { useApp } from "@/lib/store";

/** Floating location pill over the map (label + locate). Navigation is the bottom dock. */
export function AppHeader() {
  const { location, retryLocation } = useApp();

  return (
    <header className="flex shrink-0 items-center gap-2 px-4 pb-1 pt-4">
      <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-ona-ctl border border-ona-border bg-ona-surface pl-3 shadow-sm">
        <MapPin
          aria-hidden
          className="h-4 w-4 shrink-0 text-ona-muted"
          strokeWidth={2}
        />
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-ona-ink">
          {location.label}
        </p>
        <button
          type="button"
          onClick={retryLocation}
          aria-label="Use my current location"
          className="flex h-11 w-11 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-ona-muted"
        >
          <LocateFixed className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
