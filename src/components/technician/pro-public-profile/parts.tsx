import type { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stat({
  value,
  label,
  isLight,
}: {
  value: React.ReactNode;
  label: string;
  isLight: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          "text-[14px] font-bold tabular-nums leading-none",
          isLight ? "text-slate-900" : "text-white",
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-0.5 text-[10px] font-medium leading-none",
          isLight ? "text-slate-600" : "text-white/50",
        )}
      >
        {label}
      </p>
    </div>
  );
}

export function SolidSection({
  title,
  icon: Icon,
  children,
  isLight,
  card,
  cardBg,
}: {
  title: string;
  icon: typeof Wrench;
  children: React.ReactNode;
  isLight: boolean;
  card: string;
  cardBg?: string;
}) {
  return (
    <section
      className={cn(
        isLight ? "rounded-none px-0 py-2.5" : "rounded-2xl p-3",
        card,
      )}
      style={
        !isLight && cardBg && cardBg !== "transparent"
          ? { backgroundColor: cardBg }
          : undefined
      }
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon
          className="h-3.5 w-3.5 shrink-0 text-brand"
          strokeWidth={2.3}
          aria-hidden
        />
        <p
          className={cn(
            "text-[12px] font-bold tracking-tight",
            isLight ? "text-slate-900" : "text-white",
          )}
        >
          {title}
        </p>
      </div>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

export function Row({
  label,
  value,
  isLight,
}: {
  label: string;
  value: string;
  isLight: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span
        className={cn(
          "shrink-0 text-[11px] font-medium",
          isLight ? "text-slate-600" : "text-white/50",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 text-right text-[12px] font-semibold",
          isLight ? "text-slate-900" : "text-white",
        )}
      >
        {value}
      </span>
    </div>
  );
}
