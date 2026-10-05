import { cn } from "@/lib/utils";

export function NotificationToggle({
  on,
  onChange,
  label,
  describedBy,
  accent,
  trackOff,
  knobOn,
  knobOff,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  describedBy?: string;
  accent: string;
  trackOff: string;
  knobOn: string;
  knobOff: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-describedby={describedBy}
      onClick={() => onChange(!on)}
      className="relative h-7 w-12 shrink-0 rounded-full border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        backgroundColor: on ? accent : trackOff,
        outlineColor: accent,
        boxShadow: "none",
      }}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full transition-transform",
          on ? "left-[1.35rem]" : "left-0.5",
        )}
        style={{
          backgroundColor: on ? knobOn : knobOff,
          boxShadow: "none",
        }}
        aria-hidden
      />
    </button>
  );
}
