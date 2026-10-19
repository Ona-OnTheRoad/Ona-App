import { Loader2, Search } from "lucide-react";

type Props = {
  q: string;
  setQ: (v: string) => void;
  searching: boolean;
  isAuthenticated: boolean;
  onSubmit: () => void;
};

export function ShopHomeSearchBox({
  q,
  setQ,
  searching,
  isAuthenticated,
  onSubmit,
}: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 rounded-ona-ctl border border-ona-border bg-ona-field px-3 focus-within:border-ona-ink">
        <Search aria-hidden className="h-4 w-4 shrink-0 text-ona-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          aria-label="Search by product name or vehicle model"
          placeholder="Search by product name or vehicle model"
          className="h-11 min-w-0 flex-1 border-0 bg-transparent text-[13px] font-medium text-ona-ink outline-none"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={searching}
          className="rounded-full border-0 bg-ona-surface px-3 py-1.5 text-[12px] font-semibold text-ona-ink"
        >
          {searching ? (
            <Loader2 aria-label="Searching" className="h-4 w-4 animate-spin" />
          ) : (
            "Go"
          )}
        </button>
      </div>
      {!isAuthenticated ? (
        <p className="mt-1.5 text-[11px] text-ona-muted">
          Sign in to checkout, browsing is open.
        </p>
      ) : null}
    </div>
  );
}
