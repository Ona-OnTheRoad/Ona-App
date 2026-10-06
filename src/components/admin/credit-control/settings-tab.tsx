import { cn } from "@/lib/utils";
import type { AdminRow, OnAction } from "./types";

export function SettingsTab({
  settings,
  onAction,
}: {
  settings: AdminRow[];
  onAction: OnAction;
}) {
  return (
    <div className="space-y-4">
      {settings.map((s) => (
        <div
          key={String(s.key)}
          className={cn(
            "flex items-center justify-between rounded-xl border border-[var(--om-border)] bg-[var(--om-panel)] p-4",
          )}
        >
          <div>
            <p className="text-[13px] font-semibold text-[var(--om-text)]">
              {String(s.key ?? "").replace(/_/g, " ")}
            </p>
            <p className="text-[12px] text-[var(--om-text-muted)]">
              Current: {JSON.stringify(s.value)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              id={`set-${String(s.key)}`}
              defaultValue={
                typeof s.value === "string" ? s.value : JSON.stringify(s.value)
              }
              className="w-32 rounded-lg border border-[var(--om-border)] bg-[var(--om-input)] px-3 py-1.5 text-[12px] outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(
                  `set-${String(s.key)}`,
                ) as HTMLInputElement;
                if (el)
                  onAction("update-setting", { key: s.key, value: el.value });
              }}
              className="rounded-lg bg-[var(--om-accent)] px-3 py-1.5 text-[11px] font-bold text-white"
            >
              Save
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
