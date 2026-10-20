"use client";

import { useRouter } from "next/navigation";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { useSecurityAlerts } from "@/components/settings-pages/security-alerts/use-security-alerts";
import { SecurityScreenHeader } from "../security-screen-header";
import { AlertToggleCard } from "./alert-toggle-card";
import { RecentAlertsSection } from "./recent-alerts-section";

export function SecurityAlertsScreen() {
  const router = useRouter();
  const { backendUserId, userProfile, isAuthenticated, accountType } = useApp();
  const uid = backendUserId || userProfile?.email || "guest";

  const { prefs, feed, setPref, markAllRead } = useSecurityAlerts(
    uid,
    isAuthenticated,
  );

  const handleBack = () => {
    navigateBack(router, "/settings/sections/security", accountType);
  };

  const toggleItems = [
    {
      id: "newLogin",
      label: "New login",
      detail: "Someone signs in with your account",
      on: prefs.newLogin,
      onChange: (v: boolean) => setPref({ newLogin: v }),
    },
    {
      id: "passwordChange",
      label: "Password change",
      detail: "Your password is updated",
      on: prefs.passwordChange,
      onChange: (v: boolean) => setPref({ passwordChange: v }),
    },
    {
      id: "deviceChange",
      label: "Device signed out",
      detail: "A session is revoked from Sessions & devices",
      on: prefs.deviceChange,
      onChange: (v: boolean) => setPref({ deviceChange: v }),
    },
    {
      id: "pushCopy",
      label: "Also show in Notifications",
      detail: "Mirror critical security events in the bell feed",
      on: prefs.pushCopy,
      onChange: (v: boolean) => setPref({ pushCopy: v }),
    },
  ];

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SecurityScreenHeader
          title="Security alerts"
          description="Choose what security events you want to be notified about. Alerts stay on this device; turn push copy on to mirror critical ones into app notifications when available."
          onBack={handleBack}
        />

        <AlertToggleCard items={toggleItems} />

        <RecentAlertsSection feed={feed} onMarkAllRead={markAllRead} />
      </div>
    </div>
  );
}
