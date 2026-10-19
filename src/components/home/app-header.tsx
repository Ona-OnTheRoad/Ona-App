"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LocateFixed, MapPin, Menu } from "lucide-react";
import { AppMenu } from "@/components/layout/app-menu";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";

/**
 * Floating top bar over the map: location pill (label + locate) and the menu
 * button. The menu itself portals into #ona-phone.
 */
export function AppHeader() {
  const { location, retryLocation } = useApp();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMount(document.getElementById("ona-phone"));
  }, []);

  return (
    <>
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

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ona-ctl border border-ona-border bg-ona-surface p-0 shadow-sm"
          aria-label={t("home.openMenu")}
          aria-expanded={menuOpen}
        >
          <Menu className="h-5 w-5 text-ona-brand-ink" strokeWidth={2.2} />
        </button>
      </header>

      {mount &&
        createPortal(
          <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} />,
          mount,
        )}
    </>
  );
}
