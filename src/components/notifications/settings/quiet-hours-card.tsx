"use client";

import { SheetSelect } from "@/components/ui/option-sheet";
import { OnaToggle } from "@/components/ui/ona-toggle";
import type { QuietHoursConfig } from "@/lib/notifications/quiet-hours";
import { HOUR_OPTIONS, hourLabel } from "./rows";

interface QuietHoursCardProps {
  quietHours: QuietHoursConfig;
  enabled: boolean;
  dirty: boolean;
  saving: boolean;
  soundsOn: boolean;
  patchQuiet: (partial: Partial<QuietHoursConfig>) => void;
  onSave: () => void;
  onToggleSounds: (val: boolean) => void;
}

export function QuietHoursCard({
  quietHours,
  enabled,
  dirty,
  saving,
  soundsOn,
  patchQuiet,
  onSave,
  onToggleSounds,
}: QuietHoursCardProps) {
  return (
    <div className="rounded-ona-card border border-ona-border bg-ona-surface p-4 shadow-xs space-y-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
        QUIET HOURS
      </p>

      {/* Mute non-urgent row */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[12px] font-medium text-ona-ink">
            Mute non-urgent
          </p>
          <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
            Critical alerts still break through
          </p>
        </div>
        <OnaToggle
          checked={quietHours.enabled}
          disabled={!enabled}
          onChange={(val) => patchQuiet({ enabled: val })}
          label="Mute non-urgent"
        />
      </div>

      {/* From / Until Selectors */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* From */}
        <div>
          <label
            htmlFor="quiet-from-select"
            className="block text-[14px] font-medium text-ona-ink mb-1.5"
          >
            From
          </label>
          <SheetSelect
            id="quiet-from-select"
            aria-label="Quiet hours start time"
            disabled={!enabled || !quietHours.enabled}
            value={String(quietHours.startHour)}
            onChange={(v) => patchQuiet({ startHour: Number(v) })}
            options={HOUR_OPTIONS.map((h) => ({
              value: String(h),
              label: hourLabel(h),
            }))}
            searchPlaceholder="Search time"
            className="shadow-xs"
          />
        </div>

        {/* Until */}
        <div>
          <label
            htmlFor="quiet-until-select"
            className="block text-[12px] font-medium text-ona-ink mb-1.5"
          >
            Until
          </label>
          <SheetSelect
            id="quiet-until-select"
            aria-label="Quiet hours end time"
            disabled={!enabled || !quietHours.enabled}
            value={String(quietHours.endHour)}
            onChange={(v) => patchQuiet({ endHour: Number(v) })}
            options={HOUR_OPTIONS.map((h) => ({
              value: String(h),
              label: hourLabel(h),
            }))}
            searchPlaceholder="Search time"
            className="shadow-xs"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`w-full h-12 rounded-full font-medium text-[12px] transition-all flex items-center justify-center cursor-pointer disabled:opacity-70 ${
            dirty
              ? "bg-brand text-white shadow-sm hover:opacity-95 active:scale-[0.99]"
              : "bg-[#FFD3C4] dark:bg-brand/25 text-white dark:text-brand"
          }`}
        >
          {saving ? "Saving…" : dirty ? "Save preferences" : "Saved"}
        </button>

        <p className="text-[12px] font-normal text-ona-muted mt-2">
          Saved to your account and synced across devices.
        </p>
      </div>

      {/* Thin Divider */}
      <div className="border-t border-ona-border pt-4">
        {/* App sounds */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[12px] font-medium text-ona-ink">App sounds</p>
            <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
              Job, chat, and Live tones
            </p>
          </div>
          <OnaToggle
            checked={soundsOn}
            onChange={onToggleSounds}
            label="App sounds"
          />
        </div>
      </div>
    </div>
  );
}
