import { cn } from "@/lib/utils";
import { TRADE_LABEL, URGENCY_LABEL } from "./constants";
import { naira } from "./helpers";
import { Row } from "./price-rows";
import type { ExpressTheme, Quote } from "./types";

type Props = { theme: ExpressTheme; quote: Quote };

export function QuoteSummary({ theme, quote }: Props) {
  const { ink, muted, rowCard } = theme;
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className={cn("rounded-[4px] px-3 py-3", rowCard)}>
        <Row
          label={`Base fee · ${quote.trade === "mechanic" ? "Mechanic" : "Express service"}`}
          value={naira(quote.baseChargeMajor)}
          ink={ink}
        />
        <Row
          label={
            quote.distanceChargeMajor > 0
              ? `Call-out fee · ${quote.distanceKm ?? "?"} km × ₦350`
              : "Call-out fee"
          }
          value={naira(quote.calloutMajor)}
          ink={ink}
        />
        {quote.urgencyMultiplier !== 1 ? (
          <>
            <Row
              label={`Urgency · ${URGENCY_LABEL[quote.urgency] ?? quote.urgency} ×${quote.urgencyMultiplier}`}
              value={`+${naira(quote.urgencySurchargeMajor)}`}
              ink={ink}
            />
            <Row
              label="Subtotal before urgency"
              value={naira(
                Math.max(0, quote.totalMajor - quote.urgencySurchargeMajor),
              )}
              ink={ink}
            />
          </>
        ) : null}
        <div className="mt-2 border-t border-black/5 pt-2 dark:border-white/10">
          <Row
            label="Total call-out + base"
            value={naira(quote.totalMajor)}
            ink={ink}
            bold
          />
        </div>
      </div>
      <p className={cn("px-1 text-[11px] font-medium", muted)}>
        After payment, Ona instantly assigns the{" "}
        {TRADE_LABEL[quote.trade] ?? quote.trade}.
      </p>
    </div>
  );
}
