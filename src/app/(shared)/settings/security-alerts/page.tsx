"use client";

/**
 * Security alerts notify on new logins, password changes, and device events.
 * Customer + repair pro. Prefs local; alert feed local + optional sample.
 */

import { PageHeader } from "@/components/layout/page-header";
import { RecentAlertsList } from "@/components/settings-pages/security-alerts/recent-alerts-list";
import { SecurityAlertToggle } from "@/components/settings-pages/security-alerts/security-alert-toggle";
import { useSecurityAlerts } from "@/components/settings-pages/security-alerts/use-security-alerts";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function SettingsSecurityAlertsPage() {
  const { theme, backendUserId, userProfile, isAuthenticated } = useApp();
  const isLight = theme === "light";
  const uid = backendUserId || userProfile?.email || "guest";
  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-white/60";

  const { prefs, feed, setPref, markAllRead } = useSecurityAlerts(
    uid,
    isAuthenticated,
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        isLight ? "bg-[#c8c9cd]" : "bg-black",
      )}
    >
      <PageHeader
        title="Security alerts"
        subtitle="Logins, password & devices"
        backHref="/settings/sections/security"
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-8 scrollbar-hide">
        <p className={cn("px-1 text-[12px] font-medium leading-snug", muted)}>
          Choose what security events you want to be notified about. Alerts stay
          on this device; turn push copy on to mirror critical ones into app
          notifications when available.
        </p>

        <div>
          <p
            className={cn(
              "px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em]",
              muted,
            )}
          >
            Notify me about
          </p>
          <SecurityAlertToggle
            ink={ink}
            muted={muted}
            isLight={isLight}
            on={prefs.newLogin}
            onChange={(v) => setPref({ newLogin: v })}
            label="New login"
            detail="Someone signs in with your account"
          />
          <SecurityAlertToggle
            ink={ink}
            muted={muted}
            isLight={isLight}
            on={prefs.passwordChange}
            onChange={(v) => setPref({ passwordChange: v })}
            label="Password change"
            detail="Your password is updated"
          />
          <SecurityAlertToggle
            ink={ink}
            muted={muted}
            isLight={isLight}
            on={prefs.deviceChange}
            onChange={(v) => setPref({ deviceChange: v })}
            label="Device signed out"
            detail="A session is revoked from Sessions & devices"
          />
          <SecurityAlertToggle
            ink={ink}
            muted={muted}
            isLight={isLight}
            on={prefs.pushCopy}
            onChange={(v) => setPref({ pushCopy: v })}
            label="Also show in Notifications"
            detail="Mirror critical security events in the bell feed"
          />
        </div>

        <RecentAlertsList
          feed={feed}
          isLight={isLight}
          ink={ink}
          muted={muted}
          markAllRead={markAllRead}
        />
      </div>
    </div>
  );
}
