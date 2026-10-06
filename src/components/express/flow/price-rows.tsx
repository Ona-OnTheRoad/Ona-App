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
          "text-[12px]",
          bold ? "font-extrabold" : "font-semibold",
          ink,
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[13px]",
          bold ? "font-extrabold" : "font-bold",
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
