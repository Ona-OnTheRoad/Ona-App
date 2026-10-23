"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OnaToggle } from "@/components/ui/ona-toggle";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";

const KEY = "ona-a11y-font-scale";

export default function SettingsAccessibilityPage() {
  const router = useRouter();
  const { accountType } = useApp();
  const [scale, setScale] = useState(100);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    try {
      const s = Number(localStorage.getItem(KEY) || "100");
      if (s >= 90 && s <= 130) setScale(s);
      setHighContrast(localStorage.getItem(`${KEY}-hc`) === "1");
    } catch {
      /* */
    }
  }, []);

  const applyScale = (n: number) => {
    const next = Math.min(130, Math.max(90, n));
    setScale(next);
    try {
      localStorage.setItem(KEY, String(next));
      document.documentElement.style.fontSize = `${next}%`;
    } catch {
      /* */
    }
  };

  const applyHc = (on: boolean) => {
    setHighContrast(on);
    try {
      localStorage.setItem(`${KEY}-hc`, on ? "1" : "0");
      document.documentElement.dataset.a11yHc = on ? "1" : "0";
    } catch {
      /* */
    }
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20">
        {/* Top Back bar */}
        <div className="flex items-center pt-3 pb-1 mb-2">
          <button
            type="button"
            onClick={() => navigateBack(router, "/settings/appearance", accountType)}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 active:opacity-70"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Screen Title & Subtitle */}
        <header className="mb-6">
          <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
            Accessibility
          </h1>
          <p className="text-[13px] text-ona-muted mt-1">
            Text size and readability
          </p>
        </header>

        {/* Text Size Section */}
        <section className="mb-6">
          <p className="text-[14px] font-semibold text-ona-ink">
            Text size
          </p>
          <p className="text-[12px] text-ona-muted mt-0.5 mb-3">
            Current {scale}%
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => applyScale(scale - 10)}
              className="h-11 flex-1 rounded-ona-ctl border border-[#FF6B35] bg-transparent text-[14px] font-semibold text-[#FF6B35] hover:bg-[#FF6B35]/10 active:bg-[#FF6B35]/20 transition-colors flex items-center justify-center"
            >
              A- Decrease
            </button>
            <button
              type="button"
              onClick={() => applyScale(scale + 10)}
              className="h-11 flex-1 rounded-ona-ctl border border-[#FF6B35] bg-transparent text-[14px] font-semibold text-[#FF6B35] hover:bg-[#FF6B35]/10 active:bg-[#FF6B35]/20 transition-colors flex items-center justify-center"
            >
              A+ Increase
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => applyScale(100)}
              className="border-0 bg-transparent text-[13px] font-medium text-ona-ink hover:underline active:opacity-70"
            >
              Reset to default
            </button>
          </div>
        </section>

        {/* Stronger Contrast Card */}
        <section>
          <div className="flex items-center justify-between gap-3 rounded-ona-ctl border border-ona-border bg-ona-surface p-4 shadow-sm">
            <div>
              <p className="text-[14px] font-semibold text-ona-ink">
                Stronger contrast
              </p>
              <p className="text-[12px] text-ona-muted mt-0.5">
                Preference saved on this device.
              </p>
            </div>
            <OnaToggle
              checked={highContrast}
              onChange={applyHc}
              label="Stronger contrast"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
