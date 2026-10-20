"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarInitials, DEFAULT_VENDOR_PHOTO } from "@/lib/brand";
import type { UserProfile } from "@/lib/types";

interface ProfileIdentityCardProps {
  userProfile: UserProfile;
  isLight?: boolean;
}

export function ProfileIdentityCard({
  userProfile,
}: ProfileIdentityCardProps) {
  const avatarUrl = userProfile.avatarUrl || DEFAULT_VENDOR_PHOTO;

  return (
    <div className="flex flex-col items-center justify-center pt-2 pb-1">
      {/* Centered avatar with brand check badge on bottom right */}
      <div className="relative inline-block">
        <Avatar className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-ona-border shadow-sm">
          <AvatarImage
            src={avatarUrl}
            alt={userProfile.fullName}
            className="object-cover"
          />
          <AvatarFallback className="bg-brand font-bold text-white text-lg">
            {avatarInitials(userProfile.fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Verified checkmark badge matching mockup */}
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white ring-2 ring-ona-surface shadow-sm"
          aria-label="Verified motorist"
          title="Verified"
        >
          <Image
            alt="Verified"
            src="/icons/badge-check.png"
            width={12}
            height={12}
            className="h-3 w-3 object-contain"
          />
        </span>
      </div>

      {/* Centered Name */}
      <h2 className="mt-3 text-[18px] font-bold tracking-tight text-ona-ink text-center">
        {userProfile.fullName}
      </h2>

      {/* Centered Email */}
      <p className="mt-0.5 text-[13px] font-normal text-ona-muted text-center">
        {userProfile.email || userProfile.phone}
      </p>
    </div>
  );
}
