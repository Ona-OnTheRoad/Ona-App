"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PrivacyScreenHeader } from "@/components/privacy/privacy-screen-header";
import { AlertsSoundsCard } from "./settings/alerts-sounds-card";
import { NotificationTypesCard } from "./settings/notification-types-card";
import { NotificationDeliveryCard } from "./settings/notification-delivery-card";
import { QuietHoursCard } from "./settings/quiet-hours-card";
import { useNotificationSettings } from "./settings/use-notification-settings";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";

const SOUNDS_SETTINGS_KEY = "ona-app-settings";

function readLocalSounds(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(SOUNDS_SETTINGS_KEY);
    if (!raw) return true;
    const p = JSON.parse(raw) as { soundsOn?: boolean };
    return p.soundsOn !== false;
  } catch {
    return true;
  }
}

function writeLocalSounds(soundsOn: boolean) {
  try {
    localStorage.setItem(SOUNDS_SETTINGS_KEY, JSON.stringify({ soundsOn }));
  } catch {
    /* ignore */
  }
}

export function NotificationsScreen() {
  const router = useRouter();
  const { userProfile, backendUserId, displayName, accountType } = useApp();
  const userKey = backendUserId || userProfile?.email || "guest";
  const userName =
    userProfile?.fullName || displayName || "Ismael Olanrewaju";

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
  } = useNotificationSettings(userKey);

  const [soundsOn, setSoundsOn] = useState(true);

  useEffect(() => {
    setSoundsOn(readLocalSounds());
  }, []);

  const handleToggleSounds = (on: boolean) => {
    setSoundsOn(on);
    writeLocalSounds(on);
  };

  const handleBack = () => {
    navigateBack(router, "/profile", accountType);
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <PrivacyScreenHeader title="Notifications" onBack={handleBack} />

        <AlertsSoundsCard
          userName={userName}
          enabled={state.enabled}
          onChange={(val) => patch({ enabled: val })}
        />

        <NotificationTypesCard
          categories={state.categories}
          enabled={state.enabled}
          onToggle={patchCategory}
        />

        <NotificationDeliveryCard
          delivery={state.delivery}
          enabled={state.enabled}
          onToggle={patchDelivery}
        />

        <QuietHoursCard
          quietHours={state.quietHours}
          enabled={state.enabled}
          dirty={dirty}
          saving={saving}
          soundsOn={soundsOn}
          patchQuiet={patchQuiet}
          onSave={() => void handleSave()}
          onToggleSounds={handleToggleSounds}
        />

        {toast ? (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900/90 text-white text-[13px] font-medium px-4 py-2 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}
