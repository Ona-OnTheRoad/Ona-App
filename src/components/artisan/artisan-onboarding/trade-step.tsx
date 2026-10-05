import { ARTISAN_TRADE_CATALOG, tradeDef } from "@/lib/artisan/catalog";
import { cn } from "@/lib/utils";
import type { StepBaseProps } from "./types";

type Props = StepBaseProps & {
  lockedPrimaryTrade: string | null;
  onTradeLocked: () => void;
};

/** Step 1: primary trade + specialty */
export function TradeStep({
  profile,
  patch,
  styles,
  lockedPrimaryTrade,
  onTradeLocked,
}: Props) {
  const { ink, muted, soft, tradeOff, chipOff } = styles;
  const trade = tradeDef(profile.trade.service);
  return (
    <section className="space-y-3">
      <h2 className={cn("text-[15px] font-bold", ink)}>Your primary trade</h2>
      <p className={cn("text-[12px]", muted)}>
        {lockedPrimaryTrade
          ? "Pre-selected from signup. Specialty can still be set below."
          : "Pick one main skill, then a required specialty."}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ARTISAN_TRADE_CATALOG.map((t) => {
          const on = profile.trade.service === t.service;
          return (
            <button
              key={t.service}
              type="button"
              onClick={() => {
                const locked = lockedPrimaryTrade || profile.trade.service;
                // Always locked once a primary trade exists (signup or draft)
                if (locked && t.service !== locked) {
                  onTradeLocked();
                  return;
                }
                if (locked && t.service === locked) return;
                patch({
                  trade: { service: t.service, specialty: null },
                  professionAnswers: {},
                });
              }}
              className={cn(
                "rounded-md border-0 px-2.5 py-2.5 text-left text-[12px] font-bold",
                on ? "bg-[#FF6B35] text-white" : tradeOff,
                lockedPrimaryTrade && !on && "opacity-55",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "mt-0.5 block text-[10px] font-medium",
                  on ? "text-white/80" : muted,
                )}
              >
                {t.description}
              </span>
            </button>
          );
        })}
      </div>

      {trade?.specialties?.length ? (
        <div>
          <p className={cn("mb-1.5 text-[12px] font-bold", soft)}>
            Specialty <span className="text-red-600">*</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trade.specialties.map((s) => {
              const on = profile.trade.specialty === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    patch({
                      trade: {
                        ...profile.trade,
                        specialty: s,
                      },
                    })
                  }
                  className={cn(
                    "rounded-md border-0 px-2.5 py-1.5 text-[11px] font-bold",
                    on ? "bg-[#FF6B35] text-white" : chipOff,
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
