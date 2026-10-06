import { cn } from "@/lib/utils";

export function Section({
  title,
  children,
  muted,
}: {
  title: string;
  children: React.ReactNode;
  muted: string;
}) {
  return (
    <section className="bg-transparent">
      <p
        className={cn(
          "mb-2 text-[11px] font-semibold uppercase tracking-wide",
          muted,
        )}
      >
        {title}
      </p>
      {children}
    </section>
  );
}

export function DetailRow({
  label,
  value,
  ink,
  muted,
}: {
  label: string;
  value: string;
  ink: string;
  muted: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className={cn("shrink-0 text-[12px] font-medium", muted)}>
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 text-right text-[13px] font-semibold leading-snug",
          ink,
        )}
      >
        {value}
      </span>
    </div>
  );
}
