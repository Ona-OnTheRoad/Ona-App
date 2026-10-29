"use client";

import { Loader2 } from "lucide-react";

interface ProOnlineActionProps {
  proLive: boolean;
  liveBusy: boolean;
  liveErr?: string | null;
  onToggle: () => Promise<void>;
  onVerify?: () => void;
}

export function ProOnlineAction({
  proLive,
  liveBusy,
  liveErr,
  onToggle,
  onVerify,
}: ProOnlineActionProps) {
  return (
    <section className="space-y-2 dark:space-y-2.5 pt-0.5">
      <div>
        <p className="text-xs dark:text-[13px] font-semibold text-ona-ink">
          {proLive ? "You are online" : "Go online"}
        </p>
        <p className="text-xs text-ona-muted mt-0.5">
          {proLive
            ? "Customers nearby can find you."
            : "Customers nearby can find you when you're online."}
        </p>
      </div>

      <button
        type="button"
        disabled={liveBusy}
        onClick={() => void onToggle()}
        className={`flex h-12 w-full items-center justify-center rounded-2xl dark:rounded-xl font-semibold dark:font-medium text-sm dark:text-[15px] transition active:scale-[0.99] cursor-pointer disabled:opacity-50 ${
          proLive
            ? "border border-brand dark:border-ona-brand bg-ona-surface text-brand dark:text-ona-brand hover:opacity-90"
            : "bg-brand dark:bg-ona-brand hover:opacity-90 text-white shadow-xs"
        }`}
      >
        {liveBusy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : proLive ? (
          "Go Offline"
        ) : (
          "Go online"
        )}
      </button>

      {liveErr && (
        <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-ona-ink">
          <p className="font-medium text-amber-700 dark:text-amber-400">
            {liveErr}
          </p>
          {onVerify && /tier|verif|profile|id/i.test(liveErr) && (
            <button
              type="button"
              onClick={onVerify}
              className="mt-2 text-xs font-bold text-brand hover:underline cursor-pointer"
            >
              Complete verification →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
