import { cn } from "@/lib/utils";
import type { ExpressTheme } from "./types";

type Props = { theme: ExpressTheme; onPickVehicleGroup: () => void };

const COMING_SOON = [
  ["Home & Building", "Furniture · Plumber · Painter"],
  ["Power", "Solar · Generator"],
  ["Personal", "Fashion"],
] as const;

export function CategoriesView({ theme, onPickVehicleGroup }: Props) {
  const { ink, muted, rowCard } = theme;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pt-2">
      {/* 1 · OgaMecho the only active group */}
      <button
        type="button"
        onClick={onPickVehicleGroup}
        className={cn(
          "w-full rounded-[4px] border-0 px-3 py-3.5 text-left transition-transform active:scale-[0.985]",
          rowCard,
        )}
      >
        <span className={cn("block text-[15px] font-extrabold", ink)}>
          OgaMecho
        </span>
        <span className={cn("mt-0.5 block text-[11px] font-medium", muted)}>
          Mechanic · Vulcanizer · Tow · Battery · A/C · Body · Electric ·
          Scan
        </span>
      </button>

      {/* Coming-soon groups dimmed, not tappable */}
      {COMING_SOON.map(([name, subs]) => (
        <div
          key={name}
          aria-disabled
          className={cn(
            "w-full cursor-not-allowed rounded-[4px] px-3 py-3.5 opacity-40",
            rowCard,
          )}
        >
          <span className={cn("block text-[13px] font-bold", ink)}>{name}</span>
          <span className={cn("mt-0.5 block text-[11px] font-medium", muted)}>
            {subs}
          </span>
        </div>
      ))}
    </div>
  );
}
