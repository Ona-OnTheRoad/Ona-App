import { cn } from "@/lib/utils";
import { TRADE_LABEL, URGENCY_LABEL } from "./constants";
import { naira } from "./helpers";
import { Row } from "./price-rows";
import type { ExpressTheme, Quote } from "./types";

type Props = { theme: ExpressTheme; quote: Quote };

export function QuoteSummary({ theme, quote }: Props) {
  const { ink, muted } = theme;
  const tradeName = TRADE_LABEL[quote.trade] ?? "Mechanic";

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <Row
          label={`Base fee . ${tradeName}`}
          value={naira(quote.baseChargeMajor)}
          ink={ink}
        />
        <Row
          label="Call-out fee"
          value={quote.calloutMajor > 0 ? naira(quote.calloutMajor) : "NO"}
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
        <div className="mt-2.5 border-t border-gray-100 pt-2.5 dark:border-zinc-800">
          <Row
            label="Total call-out + base"
            value={naira(quote.totalMajor)}
            ink={ink}
            bold
          />
        </div>
      </div>
      <p className={cn("px-1 text-[12px] leading-relaxed text-gray-500 dark:text-zinc-400", muted)}>
        After payment, Ona instantly assigns the {tradeName}.
      </p>
    </div>
  );
}
