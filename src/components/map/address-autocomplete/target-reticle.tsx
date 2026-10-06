import { cn } from "@/lib/utils";

/** Two concentric orange circles with an orange centre dot (target reticle). */
export function TargetReticle({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-block h-4 w-4 shrink-0", className)}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full border-[1.5px] border-[#FF6B35]" />
      <span className="absolute inset-[4px] rounded-full border border-[#FF6B35]" />
      <span className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6B35]" />
    </span>
  );
}
