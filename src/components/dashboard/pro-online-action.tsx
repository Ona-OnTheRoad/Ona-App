"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <section className="space-y-3 pt-1">
      <div>
        <p className="text-[13px] font-bold text-ona-ink">
          {proLive ? "You are online" : "Go online"}
        </p>
        <p className="text-[11px] font-medium text-ona-muted">
          {proLive
            ? "Customers nearby can find you."
            : "Customers nearby can't find you when you're offline."}
        </p>
      </div>

      <button
        type="button"
        disabled={liveBusy}
        onClick={() => void onToggle()}
        className={cn(
          "flex h-12 w-full items-center justify-center rounded-xl font-bold text-[14px] transition active:scale-[0.99] cursor-pointer disabled:opacity-50",
          proLive
            ? "border border-[#FF6B35] bg-transparent text-[#FF6B35] hover:bg-[#FF6B35]/5"
            : "border-0 bg-[#FF6B35] text-white shadow-sm hover:opacity-95",
        )}
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
