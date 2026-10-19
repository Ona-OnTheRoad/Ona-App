import type { ReactElement } from "react";
import { StageButton } from "@/components/jobs/job-shell";
import type { useRouter } from "next/navigation";
import type { JobRecord } from "@/lib/jobs/types";
import { logPayGate } from "@/lib/pay-telemetry";
import { cn } from "@/lib/utils";
import type { JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
  busy: boolean;
  router: ReturnType<typeof useRouter>;
  setPayCancelOpen: (v: boolean) => void;
}

/** Agreed footer: customer pays / cancels, pro waits for escrow. */
export function AgreedFooter({
  job,
  viewer,
  isLight,
  busy,
  router,
  setPayCancelOpen,
}: Props): ReactElement {
  return viewer === "motorist" ? (
    <div className="flex w-full flex-col gap-2">
      <StageButton
        isLight={isLight}
        disabled={busy}
        onClick={() => {
          // Telemetry: a fired tap proves the CTA is clickable; a
          // missing log means an overlay swallows the tap.
          void logPayGate("pay-cta-tapped", {
            jobId: job.id,
            status: job.status,
            hasPaymentSessionEndsAt: Boolean(job.paymentSessionEndsAt),
          });
          router.push(`/payments/checkout?jobId=${encodeURIComponent(job.id)}`);
        }}
      >
        {job.paymentSessionEndsAt ? "Continue payment" : "Pay now to book"}
      </StageButton>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          void logPayGate("pay-cancel-tapped", {
            jobId: job.id,
            status: job.status,
          });
          setPayCancelOpen(true);
        }}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center rounded-md border-0 text-[13px] font-semibold",
          "relative z-10",
          isLight ? "bg-black/10 text-slate-900" : "bg-[#2c2c2e] text-white",
        )}
      >
        Cancel
      </button>
    </div>
  ) : (
    <div className="flex w-full flex-col gap-2">
      <p
        className={cn(
          "text-center text-[13px] font-semibold",
          isLight ? "text-slate-700" : "text-[#c8c9cd]",
        )}
      >
        Waiting for customer to pay into escrow…
      </p>
    </div>
  );
}
