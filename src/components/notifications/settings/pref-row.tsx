import type { ComponentType, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { NotificationToggle } from "./notification-toggle";

export type ToggleTone = {
  accent: string;
  trackOff: string;
  knobOn: string;
  knobOff: string;
};

/** One icon + label + switch row (types and delivery lists). */
export function PrefRow({
  Icon,
  id,
  label,
  detail,
  on,
  onChange,
  toggleLabel,
  tone,
  ink,
  muted,
}: {
  Icon: ComponentType<{
    className?: string;
    style?: CSSProperties;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  id: string;
  label: string;
  detail: string;
  on: boolean;
  onChange: (v: boolean) => void;
  toggleLabel: string;
  tone: ToggleTone;
  ink: string;
  muted: string;
}) {
  return (
    <li className="flex items-center gap-2 py-2.5">
      <Icon
        className="h-4 w-4 shrink-0"
        style={{ color: tone.accent }}
        strokeWidth={2.1}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p id={id} className={cn("text-[13px] font-semibold", ink)}>
          {label}
        </p>
        <p className={cn("text-[10px] font-medium", muted)}>{detail}</p>
      </div>
      <NotificationToggle
        accent={tone.accent}
        trackOff={tone.trackOff}
        knobOn={tone.knobOn}
        knobOff={tone.knobOff}
        on={on}
        onChange={onChange}
        label={toggleLabel}
        describedBy={id}
      />
    </li>
  );
}
