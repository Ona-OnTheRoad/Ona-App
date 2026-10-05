"use client";

import { Phone } from "lucide-react";
import { unlockAudio } from "@/lib/sound-tone";
import { cn } from "@/lib/utils";
import { isUuid } from "./helpers";
import type { CallTarget } from "./types";
import { useInAppCall } from "./call-context";

export function CallButton({
  target,
  className,
  label = "Call",
  variant = "solid",
}: {
  target: CallTarget;
  className?: string;
  label?: string;
  variant?: "solid" | "ghost";
}) {
  const { startCall } = useInAppCall();
  const hasPhone = Boolean((target.phone || "").replace(/[^\d+]/g, ""));
  const hasPeer = Boolean(target.userId && isUuid(target.userId));
  const disabled = !hasPhone && !hasPeer;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        unlockAudio();
        startCall(target);
      }}
      className={cn(
        "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-0 text-[13px] font-bold disabled:opacity-40",
        variant === "solid"
          ? "bg-[#2c2c2e] text-white"
          : "bg-transparent text-brand",
        className,
      )}
    >
      <Phone className="h-4 w-4" />
      {label}
    </button>
  );
}
