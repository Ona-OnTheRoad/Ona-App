"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const MAX_RADIUS = 5;

export default function SettingsAvailabilityPage() {
  const router = useRouter();
  const {
    accountType,
    userProfile,
    updateUserProfile,
    setProLive,
    proLive,
  } = useApp();

  const [radius, setRadius] = useState(2);
  const [vacation, setVacation] = useState(false);
  const [days, setDays] = useState<Record<string, boolean>>(() => ({
    Mon: true,
    Tue: false,
    Wed: false,
    Thu: false,
    Fri: false,
    Sat: false,
    Sun: false,
  }));
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useFeedbackToast(msg ?? "", err ?? "");

  useEffect(() => {
    if (userProfile?.serviceRadiusKm != null) {
      setRadius(Math.min(MAX_RADIUS, Math.max(1, userProfile.serviceRadiusKm)));
    }
    try {
      const raw = localStorage.getItem(
        `ona-pro-schedule:${userProfile?.email || "x"}`,
      );
      if (raw) {
        const p = JSON.parse(raw) as {
          days?: Record<string, boolean>;
          vacation?: boolean;
        };
        if (p.days) setDays(p.days);
        if (typeof p.vacation === "boolean") setVacation(p.vacation);
      }
    } catch {
      /* ignore */
    }
  }, [userProfile]);

  const save = () => {
    setErr(null);
    setMsg(null);
    const e = updateUserProfile({
      serviceRadiusKm: radius,
    });
    if (e) {
      setErr(e);
      return;
    }
    try {
      localStorage.setItem(
        `ona-pro-schedule:${userProfile?.email || "x"}`,
        JSON.stringify({ days, vacation }),
      );
    } catch {
      /* ignore */
    }
    if (vacation && proLive) {
      void setProLive(false);
    }
    setMsg(
      vacation
        ? "Saved. Vacation mode is on. Live is off for new jobs."
        : "Availability & radius saved.",
    );
  };

  if (accountType !== "professional") {
    return (
      <div className="ona2 flex h-full flex-col bg-ona-bg text-ona-ink">
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigateBack(router, "/settings/sections/availability", accountType)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ona-ink"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[20px] font-semibold tracking-tight">Hours & vacation</h1>
        </header>
        <p className="px-4 text-[13px] text-ona-muted">Repair Pros only.</p>
      </div>
    );
  }

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto flex min-h-full flex-col justify-between px-4 pb-8 pt-3">
        <div>
          {/* Back button */}
          <div className="flex items-center mb-3">
            <button
              type="button"
              onClick={() => navigateBack(router, "/settings/sections/availability", "professional")}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Back to Availability & Scheduling"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
            Hours & vacation
          </h1>

          <div className="mt-6 space-y-6">
            {/* Vacation Mode Card */}
            <div className="rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[13px] font-bold text-ona-ink">
                  Vacation mode
                </p>
                <p className="text-[11px] text-ona-muted mt-0.5">
                  Pauses new job requests (turns Live off).
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-label="Vacation mode"
                aria-checked={vacation}
                onClick={() => setVacation((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  vacation ? "bg-[#ea580c]" : "bg-ona-field-strong border border-ona-border"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    vacation ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Available Days */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ona-muted mb-2.5">
                AVAILABLE DAYS
              </p>

              <div className="flex items-center justify-between gap-1.5">
                {DAYS.map((d) => {
                  const selected = Boolean(days[d]);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDays((prev) => ({ ...prev, [d]: !prev[d] }))}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                        selected
                          ? "border border-[#ea580c] bg-ona-brand-soft text-[#ea580c]"
                          : "border border-ona-border bg-ona-field text-ona-ink hover:border-brand/40"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-ona-muted text-center mt-3">
                Hourly time blocks (e.g. 9:00-17:00) coming soon
              </p>
            </div>

            {/* Coverage Radius Card */}
            <div className="rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[13px] font-semibold text-ona-ink">
                  Coverage radius <span className="text-ona-muted font-normal">(max {MAX_RADIUS})</span>
                </span>
                <span className="text-[13px] font-bold text-ona-ink">
                  {radius} km
                </span>
              </div>

              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer"
                value={[radius]}
                onValueChange={(val) => setRadius(val[0])}
                min={1}
                max={MAX_RADIUS}
                step={0.5}
              >
                <Slider.Track className="bg-ona-field relative grow rounded-full h-2 border border-ona-border/50">
                  <Slider.Range className="absolute bg-[#ea580c] rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-5 h-5 bg-white border border-black/10 shadow-md rounded-full hover:scale-105 focus:outline-none transition-transform"
                  aria-label="Coverage Radius"
                />
              </Slider.Root>
            </div>
          </div>
        </div>

        {/* Bottom CTA Button */}
        <div className="pt-8 pb-4">
          <button
            type="button"
            onClick={save}
            className="flex h-12 w-full items-center justify-center rounded-ona-card bg-[#ea580c] hover:bg-[#d94e08] active:scale-[0.99] font-bold text-sm text-white shadow-xs transition cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
