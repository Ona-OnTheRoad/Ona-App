"use client";

interface ActivityMoneyCardProps {
  amountFormatted: string;
  movesCount: number;
}

export function ActivityMoneyCard({
  amountFormatted,
  movesCount,
}: ActivityMoneyCardProps) {
  return (
    <div className="rounded-ona-ctl dark:rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-5 shadow-xs">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
        Money
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-[20px] font-semibold leading-none tracking-tight text-ona-ink tabular-nums">
          {amountFormatted}
        </p>
        <p className="text-[11px] font-normal text-ona-muted">
          {movesCount} {movesCount === 1 ? "move" : "moves"}
        </p>
      </div>
    </div>
  );
}
