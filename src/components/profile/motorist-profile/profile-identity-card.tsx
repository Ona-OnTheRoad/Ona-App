"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarInitials, DEFAULT_VENDOR_PHOTO } from "@/lib/brand";
import { formatProSkill } from "@/lib/pro-service-id";
import type { UserProfile } from "@/lib/types";
import { isMotoristVerified } from "@/lib/verification-gate";
import { useApp } from "@/lib/store";

interface ProfileIdentityCardProps {
  userProfile: UserProfile;
  isLight?: boolean;
  isVerified?: boolean;
}

export function ProfileIdentityCard({
  userProfile,
  isVerified = isMotoristVerified(userProfile),
}: ProfileIdentityCardProps) {
  const { accountType, proLive, proServices } = useApp();
  const isPro = accountType === "professional";
  const avatarUrl = userProfile.avatarUrl || DEFAULT_VENDOR_PHOTO;

  const proTrade =
    formatProSkill(userProfile.services?.[0] || proServices?.[0]);

  return (
    <div className="flex flex-col items-center justify-center pt-2 pb-1">
      {/* Centered avatar with badge */}
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

        {/* Verified checkmark badge */}
        {isVerified && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white ring-2 ring-ona-surface shadow-sm"
            aria-label="Verified"
            title="Verified"
          >
            <Image
              alt="Verified"
              src="/icons/badge-check.png"
              width={12}
              height={12}
              unoptimized
              className="h-3 w-3 object-contain"
            />
          </span>
        )}
      </div>

      {/* Centered Name */}
      <h2 className="mt-3 text-[18px] font-bold tracking-tight text-ona-ink text-center">
        {userProfile.fullName}
      </h2>

      {/* Role / Email / Status */}
      {isPro ? (
        <>
          <p className="mt-0.5 text-[13px] font-medium text-ona-muted text-center">
            {proTrade}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-0.5 text-xs font-semibold shadow-2xs">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                proLive ? "bg-[#10B981]" : "bg-[#EF4444]"
              }`}
            />
            <span className={proLive ? "text-[#10B981]" : "text-[#EF4444]"}>
              {proLive ? "Online" : "Offline"}
            </span>
          </div>
        </>
      ) : (
        <p className="mt-0.5 text-[13px] font-normal text-ona-muted text-center">
          {userProfile.email || userProfile.phone}
        </p>
      )}
    </div>
  );
}
