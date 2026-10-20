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
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface divide-y divide-ona-border overflow-hidden shadow-xs">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between px-4 py-3.5"
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
              row.isBrandColor ? "text-brand" : "text-ona-ink"
            }`}
          >
            {row.value}
          </p>
        </div>
      ))}
    </div>
  );
}
