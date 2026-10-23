"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { OnaToggle } from "@/components/ui/ona-toggle";
import { PrivacyScreenHeader } from "./privacy-screen-header";

const STORAGE_KEY = "ona-privacy-prefs-v2";

type PrivacyPrefs = {
  profilePrivate: boolean;
  shareAnalytics: boolean;
};

const DEFAULT_PREFS: PrivacyPrefs = {
  profilePrivate: true,
  shareAnalytics: false,
};

function loadPrefs(uid: string): PrivacyPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${uid}`);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function PrivacySharingScreen() {
  const router = useRouter();
  const { userProfile, backendUserId, accountType } = useApp();
  const uid = backendUserId || userProfile?.email || "guest";
  const [prefs, setPrefs] = useState<PrivacyPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefs(loadPrefs(uid));
  }, [uid]);

  const updatePref = (partial: Partial<PrivacyPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(`${STORAGE_KEY}:${uid}`, JSON.stringify(next));
      } catch {
        /* */
      }
      return next;
    });
  };

  const handleBack = () => {
    navigateBack(router, "/settings/sections/privacy", accountType);
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto min-h-full px-4 pb-8 flex flex-col justify-between">
        <div className="space-y-4">
          <PrivacyScreenHeader
            title="Privacy & sharing"
            onBack={handleBack}
          />

          {/* Privacy Toggles Card */}
          <div className="rounded-ona-card border border-ona-border bg-ona-surface shadow-xs divide-y divide-ona-border overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[12px] font-medium text-ona-ink">
                  Keep profile private
                </p>
                <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
                  Default ON. Details stay private until needed for a booking.
                </p>
              </div>
              <OnaToggle
                checked={prefs.profilePrivate}
                onChange={(val) => updatePref({ profilePrivate: val })}
                label="Keep profile private"
              />
            </div>

            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[12px] font-medium text-ona-ink">
                  Share usage analytics
                </p>
                <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
                  Default OFF. Helps improve Ona; never sells your data.
                </p>
              </div>
              <OnaToggle
                checked={prefs.shareAnalytics}
                onChange={(val) => updatePref({ shareAnalytics: val })}
                label="Share usage analytics"
              />
            </div>
          </div>

          {/* Coming Soon Notice Links */}
          <div className="space-y-3 pt-6 text-center">
            <p className="text-[14px] font-medium text-ona-muted">
              Export personal data coming soon
            </p>
            <p className="text-[14px] font-medium text-ona-muted">
              Blocked users coming soon
            </p>
          </div>
        </div>

        {/* Delete Account Button */}
        <div className="pt-12 pb-4">
          <Link
            href="/settings/delete-account"
            className="w-full h-12 flex items-center justify-center gap-2 rounded-full border border-red-200 dark:border-red-900/40 bg-[#FEF0F2] dark:bg-[#FFF4F6] text-[#C70036] text-[14px] font-bold transition-all hover:bg-red-100 active:opacity-80"
          >
            <Trash2 className="h-4 w-4 text-[#C70036]" strokeWidth={2.2} />
            <span>Delete account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
