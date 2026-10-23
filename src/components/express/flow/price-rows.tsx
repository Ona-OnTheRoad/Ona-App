import { cn } from "@/lib/utils";

type RowProps = {
  label: string;
  value: string;
  ink: string;
  bold?: boolean;
};

export function Row({ label, value, ink, bold }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span
        className={cn(
          "text-[13px]",
          bold ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-600 dark:text-zinc-400",
          ink,
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          bold ? "text-[14px] font-bold text-gray-900 dark:text-white" : "text-[13px] font-semibold text-gray-900 dark:text-white",
          ink,
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function DetailRow({
  label,
  value,
  ink,
}: {
  label: string;
  value: string;
  ink: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
        {label}
      </p>
      <p className={cn("min-w-0 truncate text-[14px] font-bold", ink)}>
        {value}
      </p>
    </div>
  );
}
