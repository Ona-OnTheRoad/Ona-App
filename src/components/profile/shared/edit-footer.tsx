import { cn } from "@/lib/utils";

/** Cancel / Save footer shown while editing. */
export function EditFooter({
  isLight,
  onCancel,
  onSave,
}: {
  isLight: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className={cn(
          "h-11 flex-1 border-0 text-[13px] font-bold",
          isLight ? "bg-black/10 text-slate-900" : "bg-white/10 text-white",
        )}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="h-11 flex-1 border-0 bg-[#FF6B35] text-[13px] font-bold text-white"
      >
        Save
      </button>
    </div>
  );
}
