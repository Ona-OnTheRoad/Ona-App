import { cn } from "@/lib/utils";
import { SCHEDULE_MAX_MS } from "./constants";
import { localDateStr } from "./helpers";
import type { BookingType, ExpressTheme } from "./types";

type Props = {
  theme: ExpressTheme;
  bookingType: BookingType;
  schedDate: string;
  schedTime: string;
  scheduleValid: boolean;
  nowTs: number;
  onInstant: () => void;
  onSchedule: () => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
};

export function BookingView({
  theme,
  bookingType,
  schedDate,
  schedTime,
  scheduleValid,
  nowTs,
  onInstant,
  onSchedule,
  onDateChange,
  onTimeChange,
}: Props) {
  const { isLight, ink, muted, rowCard } = theme;
  const inputCls = cn(
    "h-11 w-full rounded-md border-0 px-3 text-[14px] font-medium outline-none",
    isLight ? "bg-black/8 text-slate-900" : "bg-[#2c2c2e] text-white",
  );
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onInstant}
        className={cn(
          "w-full rounded-[4px] px-3 py-4 text-left transition-transform active:scale-[0.985]",
          rowCard,
        )}
      >
        <span className={cn("block text-[14px] font-bold", ink)}>
          Instant (on-demand)
        </span>
        <span className={cn("mt-0.5 block text-[12px]", muted)}>
          A professional is dispatched as soon as you pay.
        </span>
      </button>
      <div
        className={cn("rounded-[4px] px-3 py-4 transition-transform", rowCard)}
      >
        <button
          type="button"
          onClick={onSchedule}
          className="w-full border-0 bg-transparent p-0 text-left"
        >
          <span className={cn("block text-[14px] font-bold", ink)}>
            Schedule for later
          </span>
          <span className={cn("mt-0.5 block text-[12px]", muted)}>
            Pick a date and time (within the next 7 days).
          </span>
        </button>
        {bookingType === "scheduled" ? (
          <div className="mt-3 flex flex-col gap-2">
            <input
              type="date"
              value={schedDate}
              min={nowTs ? localDateStr(nowTs) : ""}
              max={nowTs ? localDateStr(nowTs + SCHEDULE_MAX_MS) : ""}
              onChange={(e) => onDateChange(e.target.value)}
              className={inputCls}
            />
            <input
              type="time"
              value={schedTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className={inputCls}
            />
            {!scheduleValid && (schedDate || schedTime) ? (
              <p className="text-[11px] font-semibold text-red-500">
                Pick a time between now and 7 days ahead.
              </p>
            ) : null}
            {schedDate || schedTime ? (
              <p
                className={cn(
                  "text-[10px] font-semibold tabular-nums",
                  muted,
                )}
              >
                Captured · date: {schedDate || "none"} · time:{" "}
                {schedTime || "none"}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
