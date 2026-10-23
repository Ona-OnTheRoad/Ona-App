"use client";

import { useEffect, useState } from "react";

interface TwoFactorAuthCardProps {
  enabled: boolean;
  onToggle: () => void;
  busy?: boolean;
  subtitle?: string;
  children?: React.ReactNode;
}

export function TwoFactorAuthCard({
  enabled,
  onToggle,
  busy,
  subtitle,
  children,
}: TwoFactorAuthCardProps) {
  const [isOn, setIsOn] = useState(enabled);

  useEffect(() => {
    setIsOn(enabled);
  }, [enabled]);

  const handleToggle = () => {
    if (busy) return;
    setIsOn((prev) => !prev);
    onToggle();
  };

  const displaySubtitle =
    subtitle ?? (isOn ? "On - active" : "Off - recommended");

  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-4 shadow-xs transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-medium text-ona-ink">
            Two-factor authentication
          </p>
          <p className="text-[12px] font-normal text-ona-muted mt-0.5">
            {displaySubtitle}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-label="Toggle two-factor authentication"
          aria-checked={isOn}
          disabled={busy}
          onClick={handleToggle}
          className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: isOn ? "var(--brand, #ff6b35)" : "#cbd5e1",
            border: isOn ? "1px solid var(--brand, #ff6b35)" : "1px solid #94a3b8",
          }}
        >
          <span
            className="pointer-events-none inline-block h-5 w-5 rounded-full shadow-md transition-transform duration-200 ease-in-out"
            style={{
              backgroundColor: "#ffffff",
              transform: isOn ? "translateX(22px)" : "translateX(2px)",
            }}
          />
        </button>
      </div>

      {children ? (
        <div className="mt-3 pt-3 border-t border-ona-border animate-in fade-in duration-200">
          {children}
        </div>
      ) : null}
    </div>
  );
}
