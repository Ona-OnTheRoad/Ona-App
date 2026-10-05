import { Moon } from "lucide-react";
import type { QuietHoursConfig } from "@/lib/notifications/quiet-hours";
import { cn } from "@/lib/utils";
import { NotificationToggle } from "./notification-toggle";
import { HOUR_OPTIONS, hourLabel } from "./rows";
import type { ToggleTone } from "./pref-row";

export function QuietHoursSection({
  quietHours,
  patchQuiet,
  tone,
  isLight,
  ink,
  muted,
}: {
  quietHours: QuietHoursConfig;
  patchQuiet: (partial: Partial<QuietHoursConfig>) => void;
  tone: ToggleTone;
  isLight: boolean;
  ink: string;
  muted: string;
}) {
  const { accent, trackOff, knobOn, knobOff } = tone;
  return (
    <>
      <div className="flex items-center gap-2 py-2.5">
        <Moon
          className="h-4 w-4 shrink-0"
          style={{ color: accent }}
          strokeWidth={2.1}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className={cn("text-[13px] font-semibold", ink)}>
            Mute non-urgent
          </p>
          <p className={cn("text-[10px] font-medium", muted)}>
            Critical alerts still break through
          </p>
        </div>
        <NotificationToggle
          accent={accent}
          trackOff={trackOff}
          knobOn={knobOn}
          knobOff={knobOff}
          on={quietHours.enabled}
          onChange={(v) => patchQuiet({ enabled: v })}
          label="Quiet hours"
        />
      </div>

      {quietHours.enabled ? (
        <div className="grid grid-cols-2 gap-2 pb-1">
          <label className="block">
            <span
              className={cn(
                "mb-1 block text-[10px] font-bold uppercase",
                muted,
              )}
            >
              From
            </span>
            <select
              value={quietHours.startHour}
              onChange={(e) =>
                patchQuiet({ startHour: Number(e.target.value) })
              }
              className={cn(
                "h-9 w-full rounded-md border-0 px-2 text-[12px] font-semibold outline-none",
                isLight
                  ? "bg-[#bebfc4] text-slate-900"
                  : "bg-white/10 text-white",
              )}
              aria-label="Quiet hours start"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={`from-${h}`} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span
              className={cn(
                "mb-1 block text-[10px] font-bold uppercase",
                muted,
              )}
            >
              Until
            </span>
            <select
              value={quietHours.endHour}
              onChange={(e) => patchQuiet({ endHour: Number(e.target.value) })}
              className={cn(
                "h-9 w-full rounded-md border-0 px-2 text-[12px] font-semibold outline-none",
                isLight
                  ? "bg-[#bebfc4] text-slate-900"
                  : "bg-white/10 text-white",
              )}
              aria-label="Quiet hours end"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={`until-${h}`} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </>
  );
}
