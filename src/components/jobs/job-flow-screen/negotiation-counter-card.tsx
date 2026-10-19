import { useEffect, type ReactElement } from "react";
import { Slider } from "@/components/ui/slider";
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
  offerAmount,
  currency,
}: {
  mySide: JobViewer;
  offerInput: string;
  setOfferInput: (v: string) => void;
  /** The pro's current labour offer (motorist counter range is derived from it). */
  offerAmount?: number;
  currency?: string;
}): ReactElement {
  const isPro = mySide === "repair_pro";
  const max = offerAmount ?? 0;
  const min = Math.ceil((max * (100 - MAX_DISCOUNT_PERCENT)) / 100);
  const step = max < 1000 ? 10 : 50;
  const useSlider =
    !isPro && max > 0 && min >= MIN_OFFER_AMOUNT_MAJOR && max > min;
  const mid = Math.min(max, min + Math.round((max - min) / 2 / step) * step);
  const current = Number(offerInput.replace(/\D/g, ""));
  const inRange = current >= min && current <= max;
  // Slider drives the same offer state the numeric input used.
  useEffect(() => {
    if (useSlider && !inRange) setOfferInput(String(mid));
  }, [useSlider, inRange, mid, setOfferInput]);
  const value = inRange ? current : mid;

  if (useSlider) {
    return (
      <div className="rounded-ona-card border border-ona-border bg-ona-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              id="offer-slider-label"
              className="text-[14px] font-semibold text-ona-ink"
            >
              Your counter-offer
            </p>
            <p className="mt-0.5 text-[12px] text-ona-muted">
              Maximum discount is {MAX_DISCOUNT_PERCENT}%
            </p>
          </div>
          <p className="text-[18px] font-semibold tabular-nums text-ona-brand-ink">
            {formatMoney(value, currency)}
          </p>
        </div>
        <Slider
          className="mt-4"
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(v) => setOfferInput(String(v[0]))}
          aria-labelledby="offer-slider-label"
          thumbLabel="Labour price offer"
          getAriaValueText={(v) => formatMoney(v, currency)}
        />
        <div className="mt-2 flex justify-between text-[12px] tabular-nums text-ona-muted">
          <span>{formatMoney(min, currency)}</span>
          <span>{formatMoney(max, currency)}</span>
        </div>
      </div>
    );
  }
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
