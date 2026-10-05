"use client";

import { useRef } from "react";
import { ChevronLeft, MapPin, X } from "lucide-react";
import { knownPlaceToPick, matchKnownPlaces } from "@/lib/known-places";
import type { HelpSomeone } from "@/components/home/home-panel/use-help-someone";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Quiet “Where are they?” field that replaces the top trade strip. */
export function HelpAddressBar({
  isLight,
  addressConfirmed,
  help,
}: {
  isLight: boolean;
  addressConfirmed: boolean;
  help: HelpSomeone;
}) {
  const {
    helpInputRef: inputRef,
    helpAddress: address,
    setHelpAddress: setAddress,
    helpBusy: busy,
    helpError: error,
    setHelpError: setError,
    helpKnownHits: knownHits,
    setHelpKnownHits: setKnownHits,
    helpSuggestOpen: suggestOpen,
    setHelpSuggestOpen: setSuggestOpen,
    closeHelpMode: onClose,
    clearHelpingSomeone: onClear,
    submitHelpAddress,
    applyHelpLocation: onApplyLocation,
  } = help;
  const onSubmit = () => void submitHelpAddress();
  const swipeStartX = useRef<number | null>(null);
  const t = useT();
  return (
    <div
      className="px-3 pb-1 pt-1"
      onTouchStart={(e) => {
        swipeStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (swipeStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - swipeStartX.current;
        swipeStartX.current = null;
        // Swipe right → leave help mode (back to trades-only top)
        if (dx > 40) onClose();
      }}
      style={{ touchAction: "manipulation" }}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (addressConfirmed) {
              onClear();
            }
            onClose();
          }}
          aria-label={t("home.backToTrades")}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center border-0 bg-transparent p-0",
            isLight ? "text-slate-600" : "text-white/70",
          )}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        </button>

        <div className="relative min-w-0 flex-1">
          <MapPin
            className={cn(
              "pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2",
              isLight ? "text-slate-400" : "text-white/40",
            )}
            strokeWidth={2}
          />
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={(e) => {
              const next = e.target.value;
              setAddress(next);
              setError(null);
              const hits = matchKnownPlaces(next, 4).map((r) => r.place);
              setKnownHits(hits);
              setSuggestOpen(hits.length > 0 && next.trim().length >= 2);
              // Clearing the field restores my location
              if (!next.trim() && addressConfirmed) {
                onClear();
              }
            }}
            onFocus={() => {
              const hits = matchKnownPlaces(address, 4).map((r) => r.place);
              setKnownHits(hits);
              setSuggestOpen(hits.length > 0 && address.trim().length >= 2);
            }}
            onBlur={() => {
              window.setTimeout(() => setSuggestOpen(false), 180);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setSuggestOpen(false);
                onSubmit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                if (addressConfirmed) onClear();
                onClose();
              }
            }}
            placeholder={t("home.whereAreThey")}
            autoComplete="off"
            enterKeyHint="search"
            aria-label={t("home.whereAreTheyAria")}
            className={cn(
              "om-help-where-input h-9 w-full border-0 border-b bg-transparent pl-5 pr-7 text-[13px] font-medium outline-none transition-colors",
              isLight
                ? "border-slate-400/50 text-slate-900 placeholder:text-slate-400 focus:border-brand/60"
                : "border-white/20 text-white placeholder:text-white/40 focus:border-brand/50",
            )}
          />
          {suggestOpen && knownHits.length > 0 ? (
            <ul
              className={cn(
                "absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-44 overflow-y-auto rounded-md border-0",
                isLight ? "bg-[#c8c9cd]" : "bg-black",
              )}
              role="listbox"
            >
              {knownHits.map((p) => (
                <li key={p.id} role="option">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col items-start border-0 bg-transparent px-2.5 py-2 text-left",
                      isLight ? "hover:bg-[#d4d5db]" : "hover:bg-white/10",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const pick = knownPlaceToPick(p);
                      onApplyLocation(pick.label, pick.lat, pick.lng);
                      setSuggestOpen(false);
                    }}
                  >
                    <span
                      className={cn(
                        "text-[12px] font-bold",
                        isLight ? "text-slate-900" : "text-white",
                      )}
                    >
                      {p.name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isLight ? "text-slate-600" : "text-white/55",
                      )}
                    >
                      {p.address}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {(address || busy) && (
            <button
              type="button"
              aria-label={t("home.clearAddress")}
              disabled={busy}
              onClick={onClear}
              className={cn(
                "absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0",
                isLight ? "text-slate-400" : "text-white/40",
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-1 pl-9 text-[10px] font-medium text-red-500">
          {error}
        </p>
      )}
      {busy && (
        <p
          className={cn(
            "mt-1 pl-9 text-[10px]",
            isLight ? "text-slate-500" : "text-white/45",
          )}
        >
          {t("home.findingPlace")}
        </p>
      )}
    </div>
  );
}
