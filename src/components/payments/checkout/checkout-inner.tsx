"use client";

import { Loader2, X } from "lucide-react";
import { ConfirmCancelSheet } from "@/components/ui/confirm-cancel-sheet";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BankPayView } from "./bank-pay-view";
import { CancelChooser } from "./cancel-chooser";
import { ExpiredView } from "./expired-view";
import { MockEmbedView } from "./mock-embed-view";
import { PayingView } from "./paying-view";
import { SummaryView } from "./summary-view";
import type { CheckoutTone } from "./types";
import { useCheckout } from "./use-checkout";

export function CheckoutInner() {
  const { theme, isAuthenticated, authReady } = useApp();
  const isLight = theme === "light";
  const c = useCheckout();
  const { router, jobId, phase } = c;

  const sheet = "ona2 bg-ona-bg";
  const card = "bg-ona-surface border border-ona-border";
  const ink = "text-ona-ink";
  const muted = "text-ona-muted";
  const tone: CheckoutTone = { isLight, card, ink, muted };

  if (!authReady) {
    return (
      <div className={cn("flex h-full items-center justify-center", sheet)}>
        <Loader2 className="h-7 w-7 animate-spin text-ona-brand" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center gap-3 px-6",
          sheet,
        )}
      >
        <p className={cn("text-[14px] font-semibold", ink)}>Sign in to pay</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="h-12 rounded-ona-ctl bg-ona-brand-btn px-6 text-[14px] font-semibold text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", sheet)}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
        <div className="min-w-0">
          <h1 className={cn("text-[18px] font-bold tracking-tight", ink)}>
            {phase === "summary" ? "Secure your booking" : "Pay"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => c.setCancelOpen(true)}
          className={cn(
            "inline-flex h-11 items-center gap-1 rounded-full border-0 bg-ona-field px-3 text-[13px] font-semibold text-ona-ink",
          )}
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
          Cancel
        </button>
      </div>

      {phase === "expired" ? (
        <ExpiredView
          tone={tone}
          attemptsLeft={c.attemptsLeft}
          err={c.err}
          jobId={jobId}
          onPayAgain={() => {
            c.setErr(null);
            c.setSessionEndsAt(null);
            c.setPayUrl(null);
            void c.startPay();
          }}
          onBackToJob={() => router.replace(jobId ? `/jobs/${jobId}` : "/jobs")}
        />
      ) : phase === "paying" ? (
        <PayingView ink={ink} />
      ) : phase === "bank_pay" && c.bankPay ? (
        <BankPayView
          tone={tone}
          bankPay={c.bankPay}
          hasOpenSession={c.hasOpenSession}
          payEndsAt={c.payEndsAt}
          onPaymentExpired={c.onPaymentExpired}
          copied={c.copied}
          copyField={c.copyField}
          reference={c.reference}
          jobId={jobId}
          router={router}
          setJob={c.setJob}
          resetPayTimerOnCancel={c.resetPayTimerOnCancel}
        />
      ) : phase === "mock_embed" && c.payUrl ? (
        <MockEmbedView
          tone={tone}
          payUrl={c.payUrl}
          onClose={() => {
            c.setPayUrl(null);
            c.setPhase("summary");
          }}
        />
      ) : (
        <SummaryView
          tone={tone}
          job={c.job}
          amountLabel={c.amountLabel}
          chargeParts={c.chargeParts}
          agreedMajor={c.agreedMajor}
          calloutQuote={c.calloutQuote}
          err={c.err}
          onPay={() => void c.startPay()}
        />
      )}

      {/* Cancel chooser */}
      {c.cancelOpen ? (
        <CancelChooser
          tone={tone}
          busyCancel={c.busyCancel}
          onCancelPayment={c.cancelPaymentOnly}
          onCancelRequest={() => c.setConfirmCancelRequest(true)}
          onKeepPaying={() => c.setCancelOpen(false)}
        />
      ) : null}

      <ConfirmCancelSheet
        open={c.confirmCancelRequest}
        isLight={isLight}
        title="Cancel this request?"
        message="The request will be closed and the other party will be notified. Are you sure you want to cancel?"
        onClose={() => c.setConfirmCancelRequest(false)}
        onConfirm={() => {
          c.setConfirmCancelRequest(false);
          void c.cancelEntireRequest();
        }}
      />
    </div>
  );
}
