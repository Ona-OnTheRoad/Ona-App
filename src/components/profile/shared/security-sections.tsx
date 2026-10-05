"use client";

import { useState } from "react";
import { ProfileSection } from "@/components/profile/profile-shell";
import { PhoneChangeFlow } from "@/components/profile/security/phone-change-flow";
import { EmailChangeFlow } from "@/components/profile/security/email-change-flow";
import { PasswordChangeFlow } from "@/components/profile/security/password-change-flow";
import { NameChangeForm } from "@/components/profile/security/name-change-form";
import type { UpdateUserProfile } from "@/components/profile/shared/types";
import { profileTheme } from "@/lib/profile-system";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Phone / email / password change flows. */
export function ContactSecuritySection({
  isLight,
  userProfile,
  accessToken,
  updateUserProfile,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  accessToken: string;
  updateUserProfile: UpdateUserProfile;
}) {
  return (
    <ProfileSection title="Contact & Security" isLight={isLight}>
      <div className="space-y-3">
        <PhoneChangeFlow
          isLight={isLight}
          currentPhone={userProfile.phone}
          currentEmail={userProfile.email}
          isPhoneVerified={!!userProfile.phoneVerified}
          guarantorName={userProfile.guarantor?.fullName}
          accessToken={accessToken}
          onPhoneChanged={(p) => updateUserProfile({ phone: p })}
        />
        <hr
          className={cn(
            "border-0",
            isLight ? "border-black/8" : "border-white/8",
          )}
        />
        <EmailChangeFlow
          isLight={isLight}
          currentEmail={userProfile.email}
          isEmailVerified={!!userProfile.emailVerified}
          guarantorName={userProfile.guarantor?.fullName}
          accessToken={accessToken}
          onEmailChanged={(e) => updateUserProfile({ email: e })}
        />
        <hr
          className={cn(
            "border-0",
            isLight ? "border-black/8" : "border-white/8",
          )}
        />
        <PasswordChangeFlow isLight={isLight} accessToken={accessToken} />
      </div>
    </ProfileSection>
  );
}

/** Read-only name with request-name-change form. */
export function NameSection({
  isLight,
  userProfile,
  accessToken,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  accessToken: string;
}) {
  const t = profileTheme(isLight);
  const [nameChangeOpen, setNameChangeOpen] = useState(false);
  return (
    <ProfileSection title="Name" isLight={isLight}>
      <div className="space-y-1">
        <p className={cn("text-[13px] font-semibold", t.ink)}>
          {userProfile.fullName}
        </p>
        <p
          className={cn(
            "text-[11px]",
            isLight ? "text-slate-900" : "text-white",
          )}
        >
          Name cannot be changed here.
          <button
            type="button"
            onClick={() => setNameChangeOpen(!nameChangeOpen)}
            className={cn(
              "ml-1 font-bold",
              isLight ? "text-slate-900" : "text-white",
              nameChangeOpen ? "text-red-400" : "",
            )}
          >
            {nameChangeOpen ? "Cancel" : "Request name change"}
          </button>
        </p>
        {nameChangeOpen && (
          <div className="mt-2">
            <NameChangeForm
              isLight={isLight}
              currentName={userProfile.fullName}
              accessToken={accessToken}
              userId={userProfile.identityId}
            />
          </div>
        )}
      </div>
    </ProfileSection>
  );
}
