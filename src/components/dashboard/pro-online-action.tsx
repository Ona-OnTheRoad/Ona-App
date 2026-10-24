"use client";

import { Loader2 } from "lucide-react";

interface ProOnlineActionProps {
  proLive: boolean;
  liveBusy: boolean;
  onToggle: () => Promise<void>;
}

export function ProOnlineAction({
  proLive,
  liveBusy,
  onToggle,
}: ProOnlineActionProps) {
  return (
    <section className="space-y-2 pt-0.5">
      <div>
        <p className="text-xs font-semibold text-slate-900 dark:text-white">
          {proLive ? "You are online" : "Go online"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {proLive
            ? "Customers nearby can find you."
            : "Customers nearby can find you when you're online."}
        </p>
      </div>

      <button
        type="button"
        disabled={liveBusy}
        onClick={() => void onToggle()}
        className={`flex h-12 w-full items-center justify-center rounded-2xl font-semibold text-sm transition active:scale-[0.99] cursor-pointer disabled:opacity-50 ${
          proLive
            ? "border border-[#FF6B35] bg-white dark:bg-[#121316] text-[#FF6B35] hover:bg-orange-50/30"
            : "bg-[#FF6B35] hover:bg-[#e85a26] text-white shadow-xs"
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
    </section>
  );
}
