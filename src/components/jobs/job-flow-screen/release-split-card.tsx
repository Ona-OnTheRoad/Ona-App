import type { ReactElement } from "react";
import { onaEyebrowClass } from "@/components/ui/ona-field";
import type { JobRecord } from "@/lib/jobs/types";
import { formatMoney } from "@/lib/pricing";

interface Props {
  job: JobRecord;
  /** Repair Pro only: the 87.5 / 5 / 7.5 rows. Omit for the customer total-only card. */
  releaseProMajor?: number;
  releasePlatformMajor?: number;
  releaseVatMajor?: number | null;
  releaseTotalMajor?: number | null;
}

/** Escrow release breakdown card (split rows are Repair Pro only; customers never see 95/5). */
export function ReleaseSplitCard({
  job,
  releaseProMajor,
  releasePlatformMajor,
  releaseVatMajor,
  releaseTotalMajor,
}: Props): ReactElement {
  const row = (label: string, value: number) => (
    <div className="flex items-center justify-between gap-2 border-b border-ona-border py-2.5 text-[12px]">
      <span className="text-ona-muted">{label}</span>
      <span className="font-semibold tabular-nums text-ona-ink">
        {formatMoney(value, job.currency)}
      </span>
    </div>
  );
  return (
    <div className="rounded-ona-card border border-ona-border bg-ona-surface px-4 py-3 text-left">
      <p className={onaEyebrowClass}>Escrow release breakdown</p>
      <div className="mt-1">
        {releaseProMajor != null
          ? row("You receive (87.5% + call-out)", releaseProMajor)
          : null}
        {releasePlatformMajor != null
          ? row("Ona platform fee · 5%", releasePlatformMajor)
          : null}
        {releaseVatMajor != null
          ? row("VAT held on FLW · 7.5%", releaseVatMajor)
          : null}
      </div>
      {releaseTotalMajor != null ? (
        <div className="flex items-center justify-between pt-2.5 text-[13px] font-semibold">
          <span className="text-ona-ink">Total</span>
          <span className="tabular-nums text-ona-brand-ink">
            {formatMoney(releaseTotalMajor, job.currency)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
