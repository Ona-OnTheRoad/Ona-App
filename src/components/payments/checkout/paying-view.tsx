"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PayingView({ ink }: { ink: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-10">
      <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      <p className={cn("text-[14px] font-semibold", ink)}>Loading…</p>
    </div>
  );
}
