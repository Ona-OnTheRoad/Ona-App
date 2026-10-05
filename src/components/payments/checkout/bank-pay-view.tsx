"use client";

import { Copy, Loader2 } from "lucide-react";
import { apiGetJob } from "@/lib/jobs/client";
import type { JobRecord } from "@/lib/jobs/types";
import { forceNairaCurrency, formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { isBookedOrActiveStatus } from "../shared/job-status";
import { PayTimer } from "./pay-timer";
import type { BankTransferInfo, CheckoutTone } from "./types";

type Router = { replace: (href: string) => void };

export function BankPayView({
  tone,
  bankPay,
  hasOpenSession,
  payEndsAt,
  onPaymentExpired,
  copied,
  copyField,
  reference,
  jobId,
  router,
  setJob,
  resetPayTimerOnCancel,
}: {
  tone: CheckoutTone;
  bankPay: BankTransferInfo;
  hasOpenSession: boolean;
  payEndsAt: string | null;
  onPaymentExpired: () => void;
  copied: string | null;
  copyField: (label: string, value: string) => Promise<void>;
  reference: string | null;
  jobId: string;
  router: Router;
  setJob: (job: JobRecord) => void;
  resetPayTimerOnCancel: () => Promise<void>;
}) {
  const { isLight, card, ink, muted } = tone;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
        <div className={cn("rounded-2xl px-4 py-4 shadow-sm", card)}>
          <p
            className={cn(
              "text-[11px] font-bold uppercase tracking-wide",
              muted,
            )}
          >
            Bank transfer
          </p>

          {hasOpenSession && payEndsAt ? (
            <div
              className={cn(
                "mt-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5",
                isLight ? "bg-black/[0.04]" : "bg-white/5",
              )}
            >
              <span
                className={cn(
                  "text-[12px] font-bold uppercase tracking-wide",
                  muted,
                )}
              >
                Time left
              </span>
              <PayTimer deadline={payEndsAt} onExpire={onPaymentExpired} />
            </div>
          ) : null}

          {/* Note first so “account below” matches the layout */}
          {bankPay.note ? (
            <div
              className={cn(
                "mt-3 rounded-xl px-3 py-2.5 text-left",
                isLight ? "bg-amber-50" : "bg-amber-950/30",
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Note
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[12px] font-semibold leading-snug",
                  isLight ? "text-amber-950" : "text-amber-100",
                )}
              >
                {bankPay.note}
              </p>
            </div>
          ) : null}

          <div className="mt-3 space-y-3">
            {(
              [
                ["Bank", bankPay.bankName],
                ["Account name", bankPay.accountName],
                ["Account number", bankPay.accountNumber],
                [
                  "Amount",
                  formatMoney(
                    bankPay.amountMajor,
                    forceNairaCurrency(bankPay.currency as "NGN"),
                  ),
                ],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl px-3 py-2.5",
                  isLight ? "bg-black/[0.04]" : "bg-white/5",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[10px] font-bold uppercase", muted)}>
                    {label}
                  </p>
                  <p
                    className={cn(
                      "text-[15px] font-black break-all",
                      label === "Account number" ? "tabular-nums" : "",
                      ink,
                    )}
                  >
                    {value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void copyField(
                      label,
                      label === "Amount" ? String(bankPay.amountMajor) : value,
                    )
                  }
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border-0 bg-[#FF6B35]/15 px-2.5 py-1.5 text-[11px] font-bold text-[#FF6B35]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === label ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#FF6B35]" />
          <p className={cn("text-[12px] font-semibold", muted)}>
            Waiting for payment…
          </p>
        </div>
      </div>

      {/* Pinned bottom bar I paid / Cancel always visible */}
      <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => {
            if (!reference || !jobId) return;
            void fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference, jobId }),
            }).then(async () => {
              const j = await apiGetJob(jobId);
              if (j.ok && j.data.job) {
                setJob(j.data.job);
                const st = j.data.job.status;
                if (isBookedOrActiveStatus(st)) {
                  router.replace(`/jobs/${jobId}`);
                }
              }
            });
          }}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border-0 bg-[#FF6B35] text-[14px] font-black text-white"
        >
          I paid
        </button>
        <button
          type="button"
          onClick={() => void resetPayTimerOnCancel()}
          className={cn(
            "mt-2 w-full text-center text-[13px] font-semibold",
            muted,
          )}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
