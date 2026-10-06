import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * inDrive-style “thought” bar: top-center, no pill background.
 */
export function NearbyCountBadge({ count }: { count: number }) {
  const { theme } = useApp();
  const isLight = theme === "light";

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-2.5 z-40 flex justify-center px-10"
      aria-label={`${count} nearby technicians`}
    >
      <p
        className={cn(
          "text-[13px] font-semibold tabular-nums tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]",
          isLight ? "text-white" : "text-white",
        )}
      >
        <span className="font-bold">{count}</span> nearby
      </p>
    </div>
  );
}
