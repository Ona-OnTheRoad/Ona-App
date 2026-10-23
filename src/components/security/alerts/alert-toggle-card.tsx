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
              <p className="text-[12px] font-medium text-ona-ink">
                {item.label}
              </p>
              <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
                {item.detail}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-label={item.label}
              aria-checked={item.on}
              onClick={() => item.onChange(!item.on)}
              className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer"
              style={{
                backgroundColor: item.on ? "var(--brand, #ff6b35)" : "#cbd5e1",
                border: item.on ? "1px solid var(--brand, #ff6b35)" : "1px solid #94a3b8",
              }}
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 rounded-full shadow-md transition-transform duration-200 ease-in-out"
                style={{
                  backgroundColor: "#ffffff",
                  transform: item.on ? "translateX(22px)" : "translateX(2px)",
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
