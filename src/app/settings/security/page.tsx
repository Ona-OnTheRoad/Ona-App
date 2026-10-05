"use client";

import { ConfirmCancelSheet } from "@/components/ui/confirm-cancel-sheet";
import { PageHeader } from "@/components/layout/page-header";
import { PasswordSection } from "@/components/settings-pages/security/password-section";
import { TwoFaSection } from "@/components/settings-pages/security/two-fa-section";
import { useChangePassword } from "@/components/settings-pages/security/use-change-password";
import { useTwoFa } from "@/components/settings-pages/security/use-two-fa";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function SettingsSecurityPage() {
  const { theme, userProfile, accountType } = useApp();
  const isLight = theme === "light";
  const isPro = accountType === "professional";
  const email = userProfile?.email || "guest";

  const pw = useChangePassword();
  const fa = useTwoFa(email);

  const card = "bg-transparent";
  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-white/60";

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        isLight ? "bg-[#c8c9cd]" : "bg-black",
      )}
    >
      <PageHeader
        title="Security"
        subtitle="Password & account protection"
        backHref="/settings"
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-6 scrollbar-hide">
        {/* Password */}
        <PasswordSection isLight={isLight} card={card} ink={ink} pw={pw} />

        {/* 2FA */}
        <TwoFaSection
          isLight={isLight}
          isPro={isPro}
          card={card}
          ink={ink}
          muted={muted}
          email={email}
          phone={userProfile?.phone}
          fa={fa}
        />
      </div>
      <ConfirmCancelSheet
        open={fa.confirmCancel}
        isLight={isLight}
        title="Cancel setup?"
        message="Your security setup will not be saved."
        onClose={() => fa.setConfirmCancel(false)}
        onConfirm={() => {
          fa.setConfirmCancel(false);
          fa.cancelSetup();
        }}
      />
    </div>
  );
}
