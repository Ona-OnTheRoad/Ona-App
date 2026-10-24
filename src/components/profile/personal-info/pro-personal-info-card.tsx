"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import { AlertCircle, Camera, ChevronRight, Loader2 } from "lucide-react";
import { AvatarFileInput } from "@/components/profile/shared/avatar-picker";
import type { UserProfile } from "@/lib/types";
import { avatarInitials, DEFAULT_VENDOR_PHOTO } from "@/lib/brand";
import { formatProSkill } from "@/lib/pro-service-id";
import { memberSinceLabel } from "@/lib/profile-system";
import { useApp } from "@/lib/store";

interface ProPersonalInfoCardProps {
  userProfile: UserProfile;
  isLight?: boolean;
  accessToken: string;
  onAvatarUpdated: (url: string) => void;
  onError: (msg: string) => void;
}

export function ProPersonalInfoCard({
  userProfile,
  accessToken,
  onAvatarUpdated,
  onError,
}: ProPersonalInfoCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { proLive, setProLive, proServices } = useApp();
  const avatarUrl = userProfile.avatarUrl || DEFAULT_VENDOR_PHOTO;
  const name = userProfile.fullName || "Repair Pro";
  const proTrade = formatProSkill(userProfile.services?.[0] || proServices?.[0]);
  const memberSince = useMemo(
    () => memberSinceLabel(userProfile.registeredAt || new Date().toISOString()),
    [userProfile.registeredAt],
  );

  return (
    <div className="space-y-4 pt-1">
      {/* Under Review Notice Banner */}
      <div className="rounded-ona-card border border-amber-300/40 bg-amber-500/10 p-3.5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand">Under review</p>
          <p className="text-[11px] leading-relaxed text-ona-muted mt-0.5">
            Your documents are being checked. You stay visible only within 2 km
            until approved. After Tier 4 verification and approval you get +1
            star instantly.
          </p>
        </div>
      </div>

      {/* Profile Row with Avatar, Name, Role and Status Pill */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0">
            <div className="h-full w-full overflow-hidden rounded-full border border-ona-border bg-ona-field">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  fill
                  sizes="48px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-ona-ink">
                  {avatarInitials(name)}
                </div>
              )}
            </div>
            {/* Small yellow badge */}
            <span className="absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-ona-bg" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-brand text-white shadow-sm ring-2 ring-ona-bg transition-all hover:opacity-90 active:scale-95"
              aria-label="Change profile photo"
              title="Change photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <AvatarFileInput
              fileRef={fileRef}
              accessToken={accessToken}
              onUrl={onAvatarUpdated}
              onError={onError}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-ona-ink leading-tight">
              {name}
            </p>
            <p className="truncate text-xs text-ona-muted font-normal leading-tight mt-0.5">
              Repair Pro · {memberSince}
            </p>
          </div>
        </div>

        <div
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border shadow-2xs ${
            proLive
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              proLive ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
          {proLive ? "Online" : "Offline"}
        </div>
      </div>

      {/* 2 Stat Tiles: Experience & Skill */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-ona-card border border-ona-border bg-ona-surface p-3 text-center">
          <p className="text-[10px] font-semibold text-ona-muted uppercase tracking-wider">
            Experience
          </p>
          <p className="mt-0.5 text-sm font-bold text-ona-ink">
            {userProfile.yearsExperience
              ? `${userProfile.yearsExperience} years`
              : "3 years"}
          </p>
        </div>

        <div className="rounded-ona-card border border-ona-border bg-ona-surface p-3 text-center">
          <p className="text-[10px] font-semibold text-ona-muted uppercase tracking-wider">
            Skill
          </p>
          <p className="mt-0.5 text-sm font-bold text-ona-ink">
            {proTrade}
          </p>
        </div>
      </div>

      {/* Bio Card */}
      <div className="rounded-ona-card border border-ona-border bg-ona-surface p-4">
        <p className="text-[10px] font-bold text-ona-muted uppercase tracking-wider">
          Bio
        </p>
        <p className="mt-1 text-xs font-medium text-ona-ink">
          {userProfile.bio || "I Love Working on Engine"}
        </p>
      </div>

      {/* Service Radius Card */}
      <div className="rounded-ona-card border border-ona-border bg-ona-surface p-4">
        <p className="text-[10px] font-bold text-ona-muted uppercase tracking-wider">
          Service Radius
        </p>
        <p className="mt-1 text-xs font-medium text-ona-ink">
          {userProfile.serviceRadiusKm || 5} km coverage
        </p>
      </div>

      {/* Contact & Security */}
      <div className="rounded-ona-card border border-ona-border bg-ona-surface divide-y divide-ona-border overflow-hidden">
        <div className="p-3.5 px-4">
          <p className="text-[10px] font-bold text-ona-muted uppercase tracking-wider">
            Contact & Security
          </p>
        </div>

        <div className="flex items-center justify-between p-3.5 px-4">
          <div>
            <p className="text-[11px] text-ona-muted">Phone number</p>
            <p className="text-xs font-semibold text-ona-ink mt-0.5">
              {userProfile.phone || "+234 705 067 6207"}
            </p>
          </div>
          <span className="text-xs font-semibold text-brand hover:opacity-80 cursor-pointer">
            Change
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 px-4">
          <div>
            <p className="text-[11px] text-ona-muted">Email</p>
            <p className="text-xs font-semibold text-ona-ink mt-0.5">
              {userProfile.email || "lionrepubliktv@gmail.com"}
            </p>
          </div>
          <span className="text-xs font-semibold text-brand hover:opacity-80 cursor-pointer">
            Change
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 px-4">
          <div>
            <p className="text-[11px] text-ona-muted">Password</p>
            <p className="text-xs font-semibold text-ona-ink mt-0.5">
              ••••••••
            </p>
            <p className="text-[10px] text-ona-muted mt-0.5">
              Last changed recently
            </p>
          </div>
          <span className="text-xs font-semibold text-brand hover:opacity-80 cursor-pointer">
            Change
          </span>
        </div>
      </div>

      {/* Guarantor */}
      <div className="rounded-ona-card border border-ona-border bg-ona-surface p-4">
        <p className="text-[10px] font-bold text-ona-muted uppercase tracking-wider">
          Guarantor
        </p>
        <p className="mt-1 text-xs font-medium text-ona-ink">
          {userProfile.guarantor?.fullName || "Not set"}
        </p>
      </div>

      {/* Go Online / Go Offline Bottom Button */}
      <div className="pt-2 pb-4">
        <button
          type="button"
          onClick={() => void setProLive(!proLive)}
          className={`flex h-12 w-full items-center justify-center rounded-ona-card font-bold text-sm transition active:scale-[0.99] cursor-pointer ${
            proLive
              ? "border border-brand bg-ona-surface text-brand"
              : "bg-brand hover:bg-[#e85a26] text-white shadow-xs"
          }`}
        >
          {proLive ? "Go Offline" : "Go online"}
        </button>
      </div>
    </div>
  );
}
