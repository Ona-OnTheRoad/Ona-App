import type { ReactElement } from "react";
import type { JobRecord } from "@/lib/jobs/types";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface Props {
  job: JobRecord;
  isLight: boolean;
  ink: string;
  muted: string;
  releaseProMajor: number;
  releasePlatformMajor: number;
  releaseVatMajor: number | null;
}

/** Split breakdown on release: Repair Pro only (customers never see 95/5). */
export function ReleaseSplitCard({
  job,
  isLight,
  ink,
  muted,
  releaseProMajor,
  releasePlatformMajor,
  releaseVatMajor,
}: Props): ReactElement {
  return (
    <div
      className={cn(
        "mx-auto mt-3 w-full max-w-[280px] space-y-1.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold",
        isLight ? "bg-black/5" : "bg-white/8",
      )}
    >
      <p
        className={cn(
          "text-center text-[11px] font-bold uppercase tracking-wide",
          muted,
        )}
      >
        Split on release
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className={muted}>You receive (87.5% + call-out)</span>
        <span className={cn("tabular-nums font-black", ink)}>
          {formatMoney(releaseProMajor, job.currency)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={muted}>Ona platform (5%)</span>
        <span className={cn("tabular-nums font-black", ink)}>
          {formatMoney(releasePlatformMajor, job.currency)}
        </span>
      </div>
      {releaseVatMajor != null ? (
        <div className="flex items-center justify-between gap-2">
          <span className={muted}>VAT held on FLW (7.5%)</span>
          <span className={cn("tabular-nums font-black", ink)}>
            {formatMoney(releaseVatMajor, job.currency)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
