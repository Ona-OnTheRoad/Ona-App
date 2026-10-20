"use client";

interface TwoFactorAuthCardProps {
  enabled: boolean;
  onToggle: () => void;
  busy?: boolean;
}

export function TwoFactorAuthCard({
  enabled,
  onToggle,
  busy,
}: TwoFactorAuthCardProps) {
  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-4 flex items-center justify-between shadow-xs">
      <div>
        <p className="text-[14px] font-bold text-ona-ink">
          Two-factor authentication
        </p>
        <p className="text-[12px] font-medium text-ona-muted mt-0.5">
          {enabled ? "On - active" : "Off - recommended"}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-label="Toggle two-factor authentication"
        aria-checked={enabled}
        disabled={busy}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full border-0 transition-colors cursor-pointer disabled:opacity-50 ${
          enabled ? "bg-brand" : "bg-ona-border dark:bg-white/20"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
