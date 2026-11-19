import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TradeTone } from "./trade-page-types";

type Props = {
  tone: TradeTone;
  q: string;
  label: string;
  searchExample: string;
  searching: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
};

export function TradeSearchBox({
  tone,
  q,
  label,
  searchExample,
  searching,
  onQueryChange,
  onSubmit,
}: Props) {
  const { isLight, accentText, accentBg } = tone;
  return (
    <div className="px-3 pt-3">
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-xl border pl-3.5 pr-2",
          isLight
            ? "border-black/10 bg-black/[0.02]"
            : "border-white/10 bg-white/[0.02]",
        )}
      >
        <Search className={`h-4 w-4 shrink-0 ${accentText}`} />
        <input
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder={`Search ${label}`}
          aria-label={`Search ${label} by ${searchExample}`}
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent text-[14px] outline-none",
            isLight
              ? "text-slate-900 placeholder:text-slate-400"
              : "text-white placeholder:text-white/40",
          )}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={searching || !q.trim()}
          className={cn(
            "h-8 shrink-0 rounded-lg border-0 px-3.5 text-[12px] font-bold text-white disabled:opacity-50",
            accentBg,
          )}
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
        </button>
      </div>
    </div>
  );
}
