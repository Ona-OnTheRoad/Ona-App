"use client";

import { CheckCircle2 } from "lucide-react";
import {
  authPrimaryBtnClass,
  authPrimaryBtnStyle,
} from "@/components/auth/auth-plate";
import { cn } from "@/lib/utils";

export function ApprovedView({
  shell,
  ink,
  muted,
  onHome,
}: {
  shell: string;
  ink: string;
  muted: string;
  onHome: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center px-5 text-center",
        shell,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
      </div>
      <h2 className={cn("mt-4 text-[17px] font-bold", ink)}>Tier 2 approved</h2>
      <p
        className={cn("mt-2 max-w-[280px] text-[12px] leading-relaxed", muted)}
      >
        Your ID was submitted and approved by admin / customer care. You can
        book without the free-period limit.
      </p>
      <button
        type="button"
        className={cn(authPrimaryBtnClass, "mt-6")}
        style={authPrimaryBtnStyle}
        onClick={onHome}
      >
        Back home
      </button>
    </div>
  );
}
