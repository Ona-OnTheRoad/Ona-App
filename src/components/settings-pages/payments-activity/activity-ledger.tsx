import Link from "next/link";
import { formatMoneyMinor } from "@/lib/pricing";
import { toneClass } from "@/lib/payments/use-payment-history";
import { cn } from "@/lib/utils";
import type { usePaymentHistory } from "@/lib/payments/use-payment-history";

type Row = ReturnType<typeof usePaymentHistory>["rows"][number];

export function ActivityLedger({
  rows,
  isPro,
  isLight,
  line,
  muted,
}: {
  rows: Row[];
  isPro: boolean;
  isLight: boolean;
  line: string;
  muted: string;
}) {
  return (
    <ul className="m-0 list-none p-0">
      {rows.map((p, i) => {
        const displayAmt =
          isPro && p.proPayoutMinor != null ? p.proPayoutMinor : p.amountMinor;
        return (
          <li key={p.id}>
            <Link
              href={p.href}
              className={cn(
                "flex items-center gap-3 py-4 no-underline",
                i > 0 && "border-t",
                i > 0 && line,
              )}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-[17px] font-black tabular-nums tracking-tight text-[#FF6B35]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatMoneyMinor(displayAmt, p.currency)}
                </p>
                <p className={cn("mt-1 text-[12px] font-medium", muted)}>
                  {new Date(p.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  <span className="mx-1.5 opacity-35">·</span>
                  {new Date(p.createdAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-[12px] font-bold leading-tight",
                    toneClass(p.statusTone, isLight),
                  )}
                >
                  {p.statusLabel}
                </p>
                {p.provider ? (
                  <p
                    className={cn(
                      "mt-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      muted,
                    )}
                  >
                    {p.provider}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
