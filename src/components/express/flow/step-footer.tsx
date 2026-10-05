import { cn } from "@/lib/utils";
import { actionFlat, PINNED_BOTTOM, PRIMARY_BTN } from "./helpers";
import type { BookingType, Stage } from "./types";

type Props = {
  stage: Stage;
  isLight: boolean;
  isTextQuestion: boolean;
  canContinueText: boolean;
  onSubmitText: () => void;
  bookingType: BookingType;
  hasSchedule: boolean;
  scheduleMismatch: boolean;
  onContinueSchedule: () => void;
  busy: boolean;
  onSeePrice: () => void;
  onBack: () => void;
};

/** Bottom action bar for the questions (text), booking and location steps. */
export function StepFooter({
  stage,
  isLight,
  isTextQuestion,
  canContinueText,
  onSubmitText,
  bookingType,
  hasSchedule,
  scheduleMismatch,
  onContinueSchedule,
  busy,
  onSeePrice,
  onBack,
}: Props) {
  return (
    <div className={PINNED_BOTTOM}>
      {stage === "questions" && isTextQuestion ? (
        <button
          type="button"
          disabled={!canContinueText}
          onClick={onSubmitText}
          className={cn(PRIMARY_BTN, "mb-1 disabled:opacity-50")}
        >
          Continue
        </button>
      ) : null}
      {stage === "booking" && bookingType === "scheduled" ? (
        <>
          <button
            type="button"
            disabled={!hasSchedule}
            onClick={onContinueSchedule}
            className={cn(PRIMARY_BTN, "mb-1 disabled:opacity-50")}
          >
            Continue
          </button>
          {scheduleMismatch ? (
            <p className="mb-1 text-center text-[11px] font-semibold text-red-500">
              Pick a time between now and 7 days ahead.
            </p>
          ) : null}
        </>
      ) : null}
      {stage === "location" ? (
        <button
          type="button"
          disabled={busy}
          onClick={onSeePrice}
          className={cn(PRIMARY_BTN, "mb-1 disabled:opacity-50")}
        >
          {busy ? "Pricing…" : "See price"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "h-10 w-full rounded-md border-0 text-[14px] font-bold",
          actionFlat(isLight),
        )}
      >
        Back
      </button>
    </div>
  );
}
