"use client";

export interface BreakdownRowItem {
  label: string;
  sub: string;
  value: string;
  isBrandColor?: boolean;
}

interface BalanceBreakdownCardProps {
  rows: BreakdownRowItem[];
}

export function BalanceBreakdownCard({ rows }: BalanceBreakdownCardProps) {
  return (
    <div className="rounded-ona-ctl dark:rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent overflow-hidden shadow-xs">
      <p className="hidden dark:block px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
        Breakdown
      </p>
      <div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="px-4 dark:px-0 dark:mx-4 flex items-center justify-between border-b border-ona-border dark:border-[#18181B] py-3.5 last:border-b-0"
          >
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-[12px] font-medium text-ona-ink leading-snug">
                {row.label}
              </p>
              <p className="text-[12px] font-normal text-ona-muted mt-0.5 leading-snug">
                {row.sub}
              </p>
            </div>
            <p
              className={`shrink-0 text-right text-[14px] font-semibold tabular-nums tracking-tight ${
                row.isBrandColor ? "text-brand dark:text-ona-brand" : "text-ona-ink"
              }`}
            >
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
