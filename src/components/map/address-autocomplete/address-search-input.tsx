import { Building2, Loader2, Locate, MapPin } from "lucide-react";
import type { KnownPlace } from "@/lib/known-places";
import { cn } from "@/lib/utils";
import type { GoogleSuggestion } from "../shared/request-google-predictions";
import { TargetReticle } from "./target-reticle";

type Props = {
  isLight: boolean;
  query: string;
  busy: boolean;
  showPanel: boolean;
  knownHits: KnownPlace[];
  googleHits: GoogleSuggestion[];
  onQueryChange: (text: string) => void;
  onFocusSuggest: () => void;
  onBlurSuggest: () => void;
  onEnter: () => void;
  onEscape: () => void;
  onUseMyLocation: () => void;
  onPickKnown: (place: KnownPlace) => void;
  onPickGoogle: (s: GoogleSuggestion) => void;
};

/** Search field, "use my location" button and suggestion list. */
export function AddressSearchInput({
  isLight,
  query,
  busy,
  showPanel,
  knownHits,
  googleHits,
  onQueryChange,
  onFocusSuggest,
  onBlurSuggest,
  onEnter,
  onEscape,
  onUseMyLocation,
  onPickKnown,
  onPickGoogle,
}: Props) {
  return (
    <div className="relative">
      <TargetReticle className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2" />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={onFocusSuggest}
        onBlur={onBlurSuggest}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
          if (e.key === "Escape") onEscape();
        }}
        placeholder="Current Location…"
        autoComplete="off"
        aria-autocomplete="list"
        className={cn(
          "h-11 w-full rounded-md border-0 pl-10 pr-11 text-[13px] font-medium outline-none",
          isLight
            ? "bg-[#D8DCE4] text-slate-900 placeholder:text-slate-400"
            : "bg-white/[0.06] text-white placeholder:text-white/40",
        )}
      />

      <button
        type="button"
        onClick={onUseMyLocation}
        disabled={busy}
        aria-label="Use my current location"
        className="absolute right-1.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#FF6B35]/40 text-[#FF6B35] disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
        ) : (
          <Locate className="h-4 w-4" strokeWidth={2.4} />
        )}
      </button>

      {showPanel ? (
        <ul
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-56 overflow-y-auto rounded-md shadow-lg",
            isLight ? "bg-[#D8DCE4]" : "bg-[#1c1c1e]",
          )}
        >
          {knownHits.map((p) => (
            <li key={p.id} role="option" aria-selected="false">
              <button
                type="button"
                className="flex w-full items-start gap-2 border-0 bg-transparent px-3 py-2.5 text-left hover:bg-[#FF6B35]/10"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickKnown(p)}
              >
                <Building2
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6B35]"
                  strokeWidth={2.2}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[12px] font-bold",
                      isLight ? "text-slate-900" : "text-white",
                    )}
                  >
                    {p.name}
                  </span>
                  <span
                    className={cn(
                      "block text-[10px] font-medium",
                      isLight ? "text-slate-500" : "text-white/50",
                    )}
                  >
                    {p.address}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {googleHits.map((s) => (
            <li key={s.id} role="option" aria-selected="false">
              <button
                type="button"
                className="flex w-full items-start gap-2 border-0 bg-transparent px-3 py-2.5 text-left hover:bg-[#FF6B35]/10"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickGoogle(s)}
              >
                <MapPin
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64748b]"
                  strokeWidth={2.2}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[12px] font-bold",
                      isLight ? "text-slate-900" : "text-white",
                    )}
                  >
                    {s.primary}
                  </span>
                  <span
                    className={cn(
                      "block text-[10px] font-medium",
                      isLight ? "text-slate-500" : "text-white/50",
                    )}
                  >
                    {s.secondary}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
