"use client";

import { useMemo } from "react";
import Image from "next/image";
import { AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { avatarInitials, DEFAULT_VENDOR_PHOTO } from "@/lib/brand";
import { skillDashboardTitle } from "@/components/dashboard/dashboard-helpers";
import { memberSinceLabel } from "@/lib/profile-system";
import { useApp } from "@/lib/store";

interface ProPersonalInfoCardProps {
  userProfile: UserProfile;
  isLight?: boolean;
}

export function ProPersonalInfoCard({ userProfile }: ProPersonalInfoCardProps) {
  const { proLive, setProLive } = useApp();
  const avatarUrl = userProfile.avatarUrl || DEFAULT_VENDOR_PHOTO;
  const name = userProfile.fullName || "Repair Pro";
  const proTrade = skillDashboardTitle(userProfile.services?.[0]) || "Mechanic";
  const memberSince = useMemo(
    () => memberSinceLabel(userProfile.registeredAt || new Date().toISOString()),
    [userProfile.registeredAt],
  );

  return (
    <div className="space-y-4 pt-1">
      {/* Under Review Notice Banner */}
      <div className="rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/70 dark:bg-orange-950/20 p-3.5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#FF6B35] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#FF6B35]">Under review</p>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 mt-0.5">
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
            <div className="h-full w-full overflow-hidden rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                  {avatarInitials(name)}
                </div>
              )}
            </div>
            {/* Small yellow badge */}
            <span className="absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#121316]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
              {name}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
              Repair Pro · {memberSince}
            </p>
          </div>
        </div>

        <div
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border shadow-2xs ${
            proLive
              ? "border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-slate-900 text-[#10B981]"
              : "border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-900 text-[#EF4444]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              proLive ? "bg-[#10B981]" : "bg-[#EF4444]"
            }`}
          />
          {proLive ? "Online" : "Offline"}
        </div>
      </div>

      {/* 2 Stat Tiles: Experience & Skill */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Experience
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {userProfile.yearsExperience
              ? `${userProfile.yearsExperience} years`
              : "3 years"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Skill
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {proTrade}
          </p>
        </div>
      </div>

      {/* Bio Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Bio
        </p>
        <p className="mt-1 text-xs font-medium text-slate-800 dark:text-slate-200">
          {userProfile.bio || "I Love Working on Engine"}
        </p>
      </div>

      {/* Service Radius Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Service Radius
        </p>
        <p className="mt-1 text-xs font-medium text-slate-800 dark:text-slate-200">
          {userProfile.serviceRadiusKm || 5} km coverage
        </p>
      </div>

      {/* Contact & Security */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        <div className="p-3.5 px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Contact & Security
          </p>
        </div>

        <div className="flex items-center justify-between p-3.5 px-4">
          <div>
            <p className="text-[11px] text-slate-400">Phone number</p>
            <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
              {userProfile.phone || "+234 705 067 6207"}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
            Change
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 px-4">
          <div>
            <p className="text-[11px] text-slate-400">Email</p>
            <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
              {userProfile.email || "lionrepubliktv@gmail.com"}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
            Change
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 px-4">
          <div>
            <p className="text-[11px] text-slate-400">Password</p>
            <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
              ••••••••
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Last changed recently
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
            Change
          </span>
        </div>
      </div>

      {/* Guarantor */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Guarantor
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {userProfile.guarantor?.fullName || "Not set"}
        </p>
      </div>

      {/* Go Online / Go Offline Bottom Button */}
      <div className="pt-2 pb-4">
        <button
          type="button"
          onClick={() => void setProLive(!proLive)}
          className={`flex h-12 w-full items-center justify-center rounded-2xl font-semibold text-sm transition active:scale-[0.99] cursor-pointer ${
            proLive
              ? "border border-[#FF6B35] bg-white dark:bg-[#121316] text-[#FF6B35]"
              : "bg-[#FF6B35] hover:bg-[#e85a26] text-white shadow-xs"
          }`}
        >
          {proLive ? "Go Offline" : "Go online"}
        </button>
      </div>
    </div>
  );
}
