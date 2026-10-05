import { cn } from "@/lib/utils";
import { URGENCY_OPTIONS } from "./constants";
import type { ExpressTheme } from "./types";

type Props = {
  theme: ExpressTheme;
  busy: boolean;
  onPick: (kind: string) => void;
};

export function UrgencyView({ theme, busy, onPick }: Props) {
  const { ink, muted, rowCard } = theme;
  return (
    <div className="flex flex-col gap-2">
      <p
        className={cn(
          "mt-2 px-0.5 pb-1 text-[14px] font-bold capitalize leading-snug",
          ink,
        )}
      >
        How urgent is this?
      </p>
      <div className="flex flex-col gap-1">
        {URGENCY_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={busy}
            onClick={() => onPick(o.id)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-[4px] border-0 px-3 py-3.5 text-left transition-transform duration-150 active:scale-[0.985]",
              rowCard,
            )}
          >
            <span className={cn("text-[13px] font-bold", ink)}>{o.label}</span>
            <span className={cn("text-[12px] font-semibold", muted)}>
              {o.mult}× {o.id === "normal" ? "" : "· extra call-out"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
