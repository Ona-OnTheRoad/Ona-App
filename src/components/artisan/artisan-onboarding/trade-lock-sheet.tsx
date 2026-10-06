import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";

/** Trade lock sheet portal; outside scroll so page can always scroll */
export function TradeLockSheet({
  open,
  onClose,
  ink,
  muted,
}: {
  open: boolean;
  onClose: () => void;
  ink: string;
  muted: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} titleId="trade-lock-title">
      <p id="trade-lock-title" className={cn("text-[16px] font-bold", ink)}>
        Primary trade locked
      </p>
      <p className={cn("mt-2 text-[13px] font-medium leading-relaxed", muted)}>
        You can&apos;t change primary trade. Contact Customer care at{" "}
        <a
          href="mailto:witcowavers@gmail.com"
          className="font-bold text-[#FF6B35] no-underline"
        >
          witcowavers@gmail.com
        </a>
      </p>
    </BottomSheet>
  );
}
