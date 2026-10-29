"use client";

import { PhoneChangeFlow } from "@/components/profile/security/phone-change-flow";
import { EmailChangeFlow } from "@/components/profile/security/email-change-flow";
import { PasswordChangeFlow } from "@/components/profile/security/password-change-flow";
import type { UpdateUserProfile } from "@/components/profile/shared/types";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ContactSecurityCardProps {
  isLight: boolean;
  userProfile: UserProfile;
  accessToken: string;
  updateUserProfile: UpdateUserProfile;
}

export function ContactSecurityCard({
  isLight,
  userProfile,
  accessToken,
  updateUserProfile,
}: ContactSecurityCardProps) {
  return (
    <div className="rounded-ona-ctl border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent shadow-sm p-4 sm:p-5 transition-colors">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-ona-muted mb-3.5">
        CONTACT &amp; SECURITY
      </h3>

      <div className="space-y-4">
        {/* Phone number row & verification flow */}
        <PhoneChangeFlow
          isLight={isLight}
          currentPhone={userProfile.phone}
          currentEmail={userProfile.email}
          isPhoneVerified={!!userProfile.phoneVerified}
          guarantorName={userProfile.guarantor?.fullName}
          accessToken={accessToken}
          onPhoneChanged={(p) => updateUserProfile({ phone: p })}
        />

        {/* Email row & verification flow */}
        <EmailChangeFlow
          isLight={isLight}
          currentEmail={userProfile.email}
          isEmailVerified={!!userProfile.emailVerified}
          guarantorName={userProfile.guarantor?.fullName}
          accessToken={accessToken}
          onEmailChanged={(e) => updateUserProfile({ email: e })}
        />

        {/* Password row & change flow */}
        <PasswordChangeFlow isLight={isLight} accessToken={accessToken} />
      </div>
    </div>
  );
}
