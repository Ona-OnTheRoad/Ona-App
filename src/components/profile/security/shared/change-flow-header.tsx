import { cn } from "@/lib/utils";
import { profileTheme } from "@/lib/profile-system";

/** Label + current/new value row with Cancel / Done action. */
export function ChangeFlowHeader({
  isLight,
  label,
  value,
  done,
  onDone,
  onCancel,
}: {
  isLight: boolean;
  label: string;
  value: string;
  done: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = profileTheme(isLight);
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className={cn("text-[11px] font-semibold", t.muted)}>{label}</p>
        <p className={cn("truncate text-[13px] font-semibold", t.ink)}>
          {value}
        </p>
      </div>
      {done ? (
        <button
          type="button"
          onClick={onDone}
          className="shrink-0 rounded-lg border-0 px-3 py-1.5 text-[11px] font-bold text-brand"
        >
          Done
        </button>
      ) : (
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-lg border-0 px-3 py-1.5 text-[11px] font-bold text-red-400"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
