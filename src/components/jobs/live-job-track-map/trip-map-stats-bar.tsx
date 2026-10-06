import { cn } from "@/lib/utils";

/**
 * Map-only chrome: Time · Distance · Escrow Held.
 * Name / amount / problem stay in the lower job panel never overlaid here.
 */
export function TripMapStatsBar({
  time,
  distance,
  isLight,
}: {
  time: string;
  distance: string;
  isLight: boolean;
}) {
  const amountClass = isLight ? "text-[#111111]" : "text-white";
  const labelClass = isLight ? "text-[#555555]" : "text-white/55";

  return (
    <div
      className="pointer-events-none absolute left-3 z-[5] max-w-[calc(100%-5rem)]"
      style={{ bottom: "2.75rem" }}
    >
      <div
        className={cn(
          "flex max-w-full items-stretch rounded-lg border-0 px-1 py-1",
          isLight ? "bg-[#E8E8E8]" : "bg-[#2c2c2e]",
        )}
        style={{ border: "none", boxShadow: "none" }}
      >
        <div className="min-w-0 max-w-[5.75rem] px-2.5 py-1.5 text-center">
          <p
            className={cn(
              "text-[8px] font-semibold uppercase tracking-[0.1em] leading-none",
              labelClass,
            )}
          >
            Time
          </p>
          <p
            className={cn(
              "mt-1 truncate text-[13px] font-bold tabular-nums leading-none",
              amountClass,
            )}
            title={time}
          >
            {time}
          </p>
        </div>
        <div className="min-w-0 max-w-[5.75rem] px-2.5 py-1.5 text-center">
          <p
            className={cn(
              "text-[8px] font-semibold uppercase tracking-[0.1em] leading-none",
              labelClass,
            )}
          >
            Distance
          </p>
          <p
            className={cn(
              "mt-1 truncate text-[13px] font-bold tabular-nums leading-none",
              amountClass,
            )}
            title={distance}
          >
            {distance}
          </p>
        </div>
        <div className="shrink-0 rounded-lg border-0 bg-[#FF6B35] px-2.5 py-1.5 text-center shadow-none">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-white">
            Escrow
          </p>
          <p className="mt-0.5 text-[12px] font-bold leading-none text-white">
            Held
          </p>
        </div>
      </div>
    </div>
  );
}
