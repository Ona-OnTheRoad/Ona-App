import { Loader2, Zap } from "lucide-react";
import { expressAssignedTitle } from "@/lib/express/pricing";
import { cn } from "@/lib/utils";
import type { AssignedPro, ExpressTheme } from "./types";

type Props = {
  theme: ExpressTheme;
  detected: string | null;
  assignedPro: AssignedPro | null;
  onOpenDesk: (requestId: string) => void;
};

export function AssignedView({ theme, detected, assignedPro, onOpenDesk }: Props) {
  const { isLight, ink, muted } = theme;
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          isLight ? "bg-[#FF6B35]/10" : "bg-[#FF6B35]/15",
        )}
      >
        <Zap className="h-8 w-8 text-[#FF6B35]" />
      </div>
      <p className={cn("text-[18px] font-extrabold leading-snug", ink)}>
        {detected ? expressAssignedTitle(detected) : "Professional Assigned"}
      </p>
      <p className={cn("max-w-[260px] text-[13px] font-medium", muted)}>
        Your {detected ?? "professional"} has been locked in from
        Ona&apos;s pool no waiting for accept/reject. Any extra parts
        needed will be quoted to you after diagnosis.
      </p>
      {assignedPro?.name ? (
        <p className={cn("text-[13px] font-bold", ink)}>
          Assigned: {assignedPro.name}
        </p>
      ) : (
        <p
          className={cn(
            "flex items-center gap-2 text-[13px] font-medium",
            muted,
          )}
        >
          <Loader2 className="h-4 w-4 animate-spin" /> Assigning the
          nearest professional…
        </p>
      )}
      <button
        type="button"
        onClick={() => assignedPro && onOpenDesk(assignedPro.requestId)}
        disabled={!assignedPro}
        className="mt-2 h-11 w-full max-w-[280px] rounded-md border-0 bg-brand text-[14px] font-bold text-white disabled:opacity-50"
      >
        Open Negotiation Desk
      </button>
    </div>
  );
}
