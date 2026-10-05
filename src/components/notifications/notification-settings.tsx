"use client";

/**
 * NotificationSettings production-ready prefs for Settings.
 * Filter types · delivery (Push / SMS / Email) · quiet hours · save + toast.
 *
 * TODO(api): Persist via PATCH /api/notifications/settings when backend is ready.
 * Currently stores to localStorage keyed by user so device prefs survive reloads.
 */

import { useId } from "react";
import { Bell } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NotificationToggle } from "./settings/notification-toggle";
import { PrefRow } from "./settings/pref-row";
import { QuietHoursSection } from "./settings/quiet-hours-section";
import { CATEGORY_ROWS, DELIVERY_ROWS } from "./settings/rows";
import type { NotificationSettingsState } from "./settings/types";
import { useNotificationSettings } from "./settings/use-notification-settings";

export type {
  NotificationCategoryPref,
  NotificationDeliveryPref,
  NotificationSettingsState,
} from "./settings/types";

/** Icons, on-toggles, and primary buttons never yellow/copper */
const ACCENT = "#FF6B35";

type Props = {
  /** Compact embed under Settings, or full standalone card */
  className?: string;
  /** Called after successful save (local + future API) */
  onSaved?: (state: NotificationSettingsState) => void;
};

export function NotificationSettings({ className, onSaved }: Props) {
  const { theme, backendUserId, displayName } = useApp();
  const isLight = theme === "light";
  const accent = ACCENT;
  const userKey = backendUserId || "guest";
  const formId = useId();

  const {
    state,
    dirty,
    saving,
    toast,
    patch,
    patchCategory,
    patchDelivery,
    patchQuiet,
    handleSave,
  } = useNotificationSettings(userKey, onSaved);

  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-white/65";
  const card = isLight ? "bg-[#d4d5d9]" : "bg-[#1c1c1e]";
  // Light OFF track must be clearly darker so the white knob is visible
  const trackOff = isLight ? "#6b6e76" : "rgba(255,255,255,0.28)";
  const knobOn = "#ffffff";
  const knobOff = isLight ? "#f4f4f5" : "#ffffff";

  const tone = { accent, trackOff, knobOn, knobOff };

  const sectionLabel = (text: string) => (
    <p
      className={cn(
        "px-1 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wide",
        muted,
      )}
      id={`${formId}-${text.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {text}
    </p>
  );

  return (
    <section
      className={cn("relative", className)}
      aria-labelledby={`${formId}-title`}
    >
      <div className={cn("overflow-hidden rounded-md", card)}>
        <div className="flex items-start gap-2 px-3 pt-3">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: "rgba(255, 107, 53, 0.15)" }}
            aria-hidden
          >
            <Bell
              className="h-4 w-4"
              style={{ color: ACCENT }}
              strokeWidth={2.2}
            />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              id={`${formId}-title`}
              className={cn("text-[14px] font-bold", ink)}
            >
              Notification preferences
            </h3>
            <p className={cn("mt-0.5 text-[11px] font-medium", muted)}>
              {displayName
                ? `Alerts for ${displayName}`
                : "Choose what reaches you and how"}
            </p>
          </div>
          <NotificationToggle
            accent={accent}
            trackOff={trackOff}
            knobOn={knobOn}
            knobOff={knobOff}
            on={state.enabled}
            onChange={(v) => patch({ enabled: v })}
            label="All notifications"
          />
        </div>

        <div
          className={cn(
            "px-3 pb-3 transition-opacity",
            !state.enabled && "pointer-events-none opacity-45",
          )}
          aria-disabled={!state.enabled}
        >
          {sectionLabel("Types")}
          <ul className="space-y-0" role="list">
            {CATEGORY_ROWS.map((row) => {
              const id = `${formId}-cat-${row.key}`;
              return (
                <PrefRow
                  key={row.key}
                  Icon={row.icon}
                  id={id}
                  label={row.label}
                  detail={row.detail}
                  on={state.categories[row.key]}
                  onChange={(v) => patchCategory(row.key, v)}
                  toggleLabel={row.label}
                  tone={tone}
                  ink={ink}
                  muted={muted}
                />
              );
            })}
          </ul>

          {sectionLabel("Delivery")}
          <ul className="space-y-0" role="list">
            {DELIVERY_ROWS.map((row) => {
              const id = `${formId}-del-${row.key}`;
              return (
                <PrefRow
                  key={row.key}
                  Icon={row.icon}
                  id={id}
                  label={row.label}
                  detail={row.detail}
                  on={state.delivery[row.key]}
                  onChange={(v) => patchDelivery(row.key, v)}
                  toggleLabel={`${row.label} delivery`}
                  tone={tone}
                  ink={ink}
                  muted={muted}
                />
              );
            })}
          </ul>

          {sectionLabel("Quiet hours")}
          <QuietHoursSection
            quietHours={state.quietHours}
            patchQuiet={patchQuiet}
            tone={tone}
            isLight={isLight}
            ink={ink}
            muted={muted}
          />

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !dirty}
              className={cn(
                "h-10 flex-1 rounded-md border-0 text-[13px] font-bold text-white transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-45",
              )}
              style={{
                backgroundColor: accent,
                outlineColor: accent,
              }}
              aria-busy={saving}
            >
              {saving ? "Saving…" : dirty ? "Save preferences" : "Saved"}
            </button>
          </div>
          <p className={cn("mt-2 text-[10px] font-medium leading-snug", muted)}>
            Saved on this device. Server sync coming soon.
          </p>
        </div>
      </div>

      {toast ? (
        <div
          className="pointer-events-none absolute inset-x-3 -bottom-2 z-10 flex justify-center"
          role="status"
          aria-live="polite"
        >
          <div
            className="rounded-md border-0 px-3 py-2 text-center text-[12px] font-semibold"
            style={{
              backgroundColor: isLight ? "#c8c9cd" : "#000000",
              color: isLight ? "#1a1b1e" : "#f5f5f5",
            }}
          >
            {toast}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default NotificationSettings;
