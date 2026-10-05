import { cn } from "@/lib/utils";

export function SecurityAlertToggle({
  ink,
  muted,
  isLight,
  on,
  onChange,
  label,
  detail,
}: {
  ink: string;
  muted: string;
  isLight: boolean;
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-2 py-3">
      <div className="min-w-0">
        <p className={cn("text-[13px] font-bold", ink)}>{label}</p>
        <p className={cn("mt-0.5 text-[11px] font-medium leading-snug", muted)}>
          {detail}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn(
          "h-7 w-12 shrink-0 rounded-full border-0",
          on ? "bg-[#FF6B35]" : isLight ? "bg-black/20" : "bg-white/20",
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-white transition-transform",
            on ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
