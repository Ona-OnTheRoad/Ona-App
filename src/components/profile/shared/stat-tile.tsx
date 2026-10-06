import { profileTheme } from "@/lib/profile-system";
import { cn } from "@/lib/utils";

/** Single stat cell used in own-profile stat grids. */
export function StatTile({
  isLight,
  label,
  value,
  valueClass,
}: {
  isLight: boolean;
  label: string;
  value: React.ReactNode;
  /** Font-size class for the value (e.g. text-[14px]). */
  valueClass: string;
}) {
  const t = profileTheme(isLight);
  return (
    <div
      className={cn(
        "rounded-xl py-2",
        isLight ? "bg-black/[0.04]" : "bg-[#2c2c2e]",
      )}
    >
      <p className={cn(valueClass, "font-black tabular-nums", t.ink)}>
        {value}
      </p>
      <p className={cn("text-[10px]", t.muted)}>{label}</p>
    </div>
  );
}
