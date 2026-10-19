import { Radio } from "lucide-react";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { cn } from "@/lib/utils";

export function LiveHeaderToggle({
  liveBusy,
  proLive,
  isLight,
  toggleLive,
}: {
  liveBusy: boolean;
  proLive: boolean;
  isLight: boolean;
  toggleLive: () => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-end gap-2 px-3 pb-2">
      <button
        type="button"
        disabled={liveBusy}
        onClick={() => void toggleLive()}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 border-0 bg-transparent px-0 py-1 text-xs font-bold",
          proLive
            ? "text-emerald-600"
            : isLight
              ? "text-slate-500"
              : "text-[#a1a1a6]",
        )}
        aria-pressed={proLive}
      >
        <span
          className={cn(
            "inline-flex h-2 w-2 rounded-full",
            proLive ? "bg-emerald-500" : "bg-slate-400",
          )}
        />
        {liveBusy ? "…" : proLive ? "Live" : "Live"}
      </button>
    </div>
  );
}

export function GoLiveSection({
  liveBusy,
  proLive,
  liveErr,
  awayLabel,
  ink,
  muted,
  toggleLive,
}: {
  liveBusy: boolean;
  proLive: boolean;
  liveErr: string | null;
  awayLabel: string;
  ink: string;
  muted: string;
  toggleLive: () => Promise<void>;
}) {
  useFeedbackToast("", liveErr ?? "");
  return (
    <section className="pb-4">
      <div className="flex items-center gap-3">
        <Radio
          className={cn(
            "h-5 w-5 shrink-0",
            proLive ? "text-emerald-500" : "text-[#FF6B35]",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className={cn("text-[15px] font-black", ink)}>
            {proLive ? "You are Live" : "Go Live"}
          </p>
          <p className={cn("text-[10px] font-medium leading-snug", muted)}>
            {proLive
              ? "You’re Live. Customers nearby can find you."
              : "Customers nearby can find you when you’re Live."}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={liveBusy}
        onClick={() => void toggleLive()}
        className={cn(
          "mt-3 inline-flex h-11 w-full items-center justify-center rounded-md border-0",
          "bg-[#2c2c2e] text-[14px] font-semibold text-white transition active:scale-[0.99]",
          "disabled:opacity-50",
        )}
      >
        {liveBusy ? "Updating…" : proLive ? awayLabel : "Go Live"}
      </button>
    </section>
  );
}
