import type { ReactElement } from "react";
import {
  MAX_DISCOUNT_PERCENT,
  MAX_OFFER_DIGITS,
  MIN_OFFER_AMOUNT_MAJOR,
} from "@/lib/jobs/constants";
import type { JobViewer } from "./types";
import { formatMoney } from "@/lib/pricing";

/**
 * Counter-offer / labour price entry. Numeric text input (digits only,
 * maxLength MAX_OFFER_DIGITS, no leading zeros): same sanitising as before.
 */
export function NegotiationCounterCard({
  mySide,
  offerInput,
  setOfferInput,
}: {
  mySide: JobViewer;
  offerInput: string;
  setOfferInput: (v: string) => void;
}): ReactElement {
  const isPro = mySide === "repair_pro";
  const hintId = "offer-hint";
  return (
    <div className="rounded-ona-card border border-ona-border bg-ona-surface p-4">
      <label
        htmlFor="labour-offer"
        className="text-[14px] font-semibold text-ona-ink"
      >
        {isPro ? "Your labour price" : "Your counter-offer"}
      </label>
      <p id={hintId} className="mt-0.5 text-[12px] text-ona-muted">
        {isPro
          ? `Minimum ${formatMoney(MIN_OFFER_AMOUNT_MAJOR)}`
          : `Maximum discount is ${MAX_DISCOUNT_PERCENT}%`}
      </p>
      <div className="mt-3 flex h-12 items-center gap-2 rounded-ona-ctl border border-ona-border bg-ona-field px-3 focus-within:border-ona-brand">
        <span aria-hidden className="text-[16px] font-semibold text-ona-muted">
          ₦
        </span>
        <input
          id="labour-offer"
          inputMode="numeric"
          pattern="[1-9][0-9]*"
          maxLength={MAX_OFFER_DIGITS}
          aria-describedby={hintId}
          value={offerInput}
          onChange={(e) => {
            const raw = e.target.value
              .replace(/\D/g, "")
              .slice(0, MAX_OFFER_DIGITS);
            if (raw === "") {
              setOfferInput("");
              return;
            }
            if (/^0+$/.test(raw)) {
              setOfferInput("");
              return;
            }
            setOfferInput(raw.replace(/^0+/, "") || raw);
          }}
          placeholder={isPro ? "Labour price" : "Counter amount"}
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-[18px] font-semibold tabular-nums text-ona-ink outline-none focus-visible:outline-none"
          aria-label="Labour price offer"
        />
      </div>
    </div>
  );
}
