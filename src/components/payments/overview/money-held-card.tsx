"use client";

interface MoneyHeldCardProps {
  label: string;
  amountFormatted: string;
  subtext: string;
}

export function MoneyHeldCard({
  label,
  amountFormatted,
  subtext,
}: MoneyHeldCardProps) {
  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-6 text-center shadow-xs">
      <p className="text-[11px] font-semibold text-ona-muted">
        {label}
      </p>
      <p className="mt-2 text-[24px] font-extrabold leading-none tracking-tight text-brand tabular-nums">
        {amountFormatted}
      </p>
      <p className="mt-3 text-[11px] font-semibold text-ona-muted">
        {subtext}
      </p>
    </div>
  );
}
