import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShopHomeTone } from "./shop-home-types";

type Props = {
  tone: ShopHomeTone;
  q: string;
  setQ: (v: string) => void;
  searching: boolean;
  isAuthenticated: boolean;
  onSubmit: () => void;
};

export function ShopHomeSearchBox({
  tone,
  q,
  setQ,
  searching,
  isAuthenticated,
  onSubmit,
}: Props) {
  const { isLight, accentText, muted } = tone;
  return (
    <div className="px-3 pt-2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2.5",
          isLight ? "bg-black/[0.02]" : "bg-white/[0.02]",
        )}
      >
        <Search className={`h-4 w-4 shrink-0 ${accentText}`} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="Search by product name or vehicle model"
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
          disabled={searching}
          className={cn(
            "rounded-lg border-0 px-3 py-1.5 text-[12px] font-bold",
            isLight ? "bg-black/8 text-slate-800" : "bg-white/10 text-white",
          )}
        >
          {searching ? (
            <Loader2
              className="h-4 w-4 animate-spin"
              style={{ color: isLight ? "#334155" : "#ffffff" }}
            />
          ) : (
            "Go"
          )}
        </button>
      </div>
      {!isAuthenticated ? (
        <p className={cn("mt-1.5 text-[11px]", muted)}>
          Sign in to checkout browsing is open.
        </p>
      ) : null}
    </div>
  );
}
