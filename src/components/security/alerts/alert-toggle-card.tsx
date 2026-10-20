"use client";

interface AlertToggleItem {
  id: string;
  label: string;
  detail: string;
  on: boolean;
  onChange: (val: boolean) => void;
}

interface AlertToggleCardProps {
  items: AlertToggleItem[];
}

export function AlertToggleCard({ items }: AlertToggleCardProps) {
  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface shadow-xs overflow-hidden">
      <div className="px-4 pt-3.5 pb-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
          Notify me about
        </p>
      </div>

      <div className="divide-y divide-ona-border">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-[14px] font-bold text-ona-ink">
                {item.label}
              </p>
              <p className="text-[12px] font-medium text-ona-muted mt-0.5 leading-snug">
                {item.detail}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-label={item.label}
              aria-checked={item.on}
              onClick={() => item.onChange(!item.on)}
              className={`relative h-7 w-12 shrink-0 rounded-full border-0 transition-colors cursor-pointer ${
                item.on ? "bg-brand" : "bg-ona-border dark:bg-white/20"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  item.on ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
