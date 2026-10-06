import { cn } from "@/lib/utils";
import { TRADE_LABEL } from "./constants";
import { PINNED_BOTTOM, PRIMARY_BTN } from "./helpers";
import type { ExpressTheme } from "./types";

type Props = {
  theme: ExpressTheme;
  detectedTrade: string;
  onContinue: () => void;
  onBack: () => void;
};

export function DetectedView({
  theme,
  detectedTrade,
  onContinue,
  onBack,
}: Props) {
  const { isLight, ink, muted, rowCard } = theme;
  return (
    <>
      <div>
        <div
          className={cn("mt-2 rounded-[4px] px-4 py-5 text-center", rowCard)}
        >
          <span className={cn("block text-[15px] font-extrabold", ink)}>
            We&apos;ve got it.
          </span>
          <span
            className={cn(
              "mt-1 block text-[17px] font-extrabold",
              isLight ? "text-black" : "text-[#FF6B35]",
            )}
          >
            {TRADE_LABEL[detectedTrade] ?? detectedTrade} will be assigned to
            you.
          </span>
        </div>
      </div>
      <div className={PINNED_BOTTOM}>
        <button type="button" onClick={onContinue} className={PRIMARY_BTN}>
          Continue
        </button>
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "mt-1 h-9 w-full border-0 bg-transparent text-[12px] font-semibold underline-offset-2 hover:underline",
            muted,
          )}
        >
          Not correct? Go back and adjust your answers
        </button>
      </div>
    </>
  );
}
