import type { RefObject } from "react";
import { Building2, MapPin } from "lucide-react";
import type { KnownPlace } from "@/lib/known-places";
import type { GoogleSuggestion } from "../shared/request-google-predictions";

type Props = {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  showPanel: boolean;
  knownHits: KnownPlace[];
  googleHits: GoogleSuggestion[];
  onQueryChange: (text: string) => void;
  onFocusSuggest: () => void;
  onBlurSuggest: () => void;
  onEscape: () => void;
  onSubmit: () => void;
  onPickKnown: (place: KnownPlace) => void;
  onPickGoogle: (s: GoogleSuggestion) => void;
};

/** Search input + suggestion list for the Google map picker. */
export function LocationSearchBox({
  inputRef,
  query,
  showPanel,
  knownHits,
  googleHits,
  onQueryChange,
  onFocusSuggest,
  onBlurSuggest,
  onEscape,
  onSubmit,
  onPickKnown,
  onPickGoogle,
}: Props) {
  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-2.5 top-1/2 z-20 h-3.5 w-3.5 -translate-y-1/2 text-[#FF6B35]" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={onFocusSuggest}
        onBlur={onBlurSuggest}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
          if (e.key === "Escape") onEscape();
        }}
        placeholder="Search place, street, or company…"
        className="h-10 w-full rounded-md border border-[#9A9EA6] bg-[#E2E3E7] py-0 pl-8 pr-3 text-[13px] font-medium text-[#0f172a] outline-none placeholder:text-[#6b7280] focus:border-[#6B7280] focus:bg-[#E8E9ED]"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls="om-location-suggestions"
      />

      {showPanel ? (
        <ul
          id="om-location-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-56 overflow-y-auto rounded-md border-0 bg-[#E2E3E7]"
        >
          {knownHits.map((p) => (
            <li key={p.id} role="option">
              <button
                type="button"
                className="flex w-full items-start gap-2 border-0 bg-transparent px-2.5 py-2.5 text-left hover:bg-[#d4d5db] active:bg-[#c8c9cd]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickKnown(p)}
              >
                <Building2
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6B35]"
                  strokeWidth={2.2}
                />
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold text-[#0f172a]">
                    {p.name}
                  </span>
                  <span className="block text-[10px] font-medium text-[#475569]">
                    {p.address}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {googleHits.map((s) => (
            <li key={s.id} role="option">
              <button
                type="button"
                className="flex w-full items-start gap-2 border-0 bg-transparent px-2.5 py-2.5 text-left hover:bg-[#d4d5db] active:bg-[#c8c9cd]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickGoogle(s)}
              >
                <MapPin
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64748b]"
                  strokeWidth={2.2}
                />
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold text-[#0f172a]">
                    {s.primary}
                  </span>
                  <span className="block text-[10px] font-medium text-[#475569]">
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
