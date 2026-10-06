import type { JobRecord } from "@/lib/jobs/types";
import { formatMoney } from "@/lib/pricing";
import { useJobCallout } from "@/lib/callout/use-job-callout";
import { cn } from "@/lib/utils";
import { tradeFallbackFee } from "./helpers";

/** Per-card concise Base + Call-Out fee. Fetches the locked quote for this
 * request (or the server estimate while still pairing) and shows the fee
 * once the quote is available. Refetches when the job status changes so a
 * restarted search (customer Retry) still surfaces the fee. */
export function CalloutFeeOnCard({
  job,
  isLight,
}: {
  job: JobRecord;
  isLight: boolean;
}) {
  const { quote } = useJobCallout(job.id, job.status, job.calloutQuote);
  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-white/50";
  const qFee = Number(quote?.calloutFee);
  const payable = quote && Number.isFinite(qFee) && qFee > 0 ? qFee : 0;
  const fee = payable > 0 ? payable : tradeFallbackFee(job.serviceType, quote);
  const currency = quote?.currency || job.currency || "NGN";
  return (
    <div
      className={cn(
        "mt-2.5 border-t pt-2",
        isLight ? "border-black/10" : "border-white/10",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("text-[11px] font-bold", ink)}>Call Out Fee</span>
        {quote ? (
          <span className={cn("text-[11px] font-black tabular-nums", ink)}>
            {formatMoney(fee, currency)}
          </span>
        ) : (
          <span className={cn("text-[11px] font-semibold", muted)}>
            Calculating…
          </span>
        )}
      </div>
    </div>
  );
}
