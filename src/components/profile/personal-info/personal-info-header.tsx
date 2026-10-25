"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarFileInput } from "@/components/profile/shared/avatar-picker";
import { avatarInitials } from "@/lib/brand";
import { useI18n } from "@/lib/i18n";
import { memberSinceLabel } from "@/lib/profile-system";
import { navigateBack } from "@/lib/navigation";
import type { UserProfile } from "@/lib/types";

interface PersonalInfoHeaderProps {
  userProfile: UserProfile;
  isLight?: boolean;
  accessToken: string;
  onAvatarUpdated: (url: string) => void;
  onError: (msg: string) => void;
}

export function PersonalInfoHeader({
  userProfile,
  accessToken,
  onAvatarUpdated,
  onError,
}: PersonalInfoHeaderProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const avatarUrl = userProfile.avatarUrl?.trim() || undefined;
  const memberSince = memberSinceLabel(userProfile.registeredAt);

  return (
    <div className="pt-2 pb-4">
      {/* Top Bar with Back Arrow */}
      <div className="flex items-center mb-3">
        <button
          type="button"
          onClick={() => navigateBack(router, "/profile", "motorist")}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 active:opacity-70"
          aria-label="Back to Profile"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
      </div>

      {/* Screen Title */}
      <h1 className="text-[20px] font-semibold tracking-tight mb-5 text-ona-ink">
        {t("settings.hub.personalInfo")}
      </h1>

      {/* Identity row: Avatar with camera badge + Name + Member since */}
      <div className="flex items-center gap-4">
        {/* Avatar with brand camera badge button */}
        <div className="relative shrink-0">
          <Avatar className="h-17.5 w-17.5 overflow-hidden rounded-full ring-2 ring-ona-border shadow-sm">
            {avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt={userProfile.fullName}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-brand font-bold text-white text-lg">
              {avatarInitials(userProfile.fullName)}
            </AvatarFallback>
          </Avatar>

          {/* Camera Badge Button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white ring-2 ring-ona-surface shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all"
            aria-label="Change profile photo"
            title="Change photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>

          {/* Hidden File Input for uploading */}
          <AvatarFileInput
            fileRef={fileRef}
            accessToken={accessToken}
            onUrl={onAvatarUpdated}
            onError={onError}
          />
        </div>

        {/* Name and Member since */}
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-bold tracking-tight leading-snug truncate text-ona-ink">
            {userProfile.fullName}
          </h2>
          <p className="text-[11px] font-normal mt-0.5 text-ona-muted">
            Member since {memberSince}
          </p>
        </div>
      </div>
    </div>
  );
}
