"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NavMenuButton } from "@/components/layout/nav-slider/nav-menu-button";
import { defaultBackHref, navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { ProfileIdentityCard } from "./profile-identity-card";
import { ProfileMenuCard } from "./profile-menu-card";
import { ProfileLogoutButton } from "./profile-logout-button";

interface MotoristProfileHubProps {
  isLight?: boolean;
}

export function MotoristProfileHub({ isLight }: MotoristProfileHubProps) {
  const { userProfile, accountType } = useApp();
  const router = useRouter();

  if (!userProfile) return null;

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pt-4 pb-8">
        {/* Screen Title */}
        <header className="flex items-center gap-2 pt-2 pb-2">
          <button
            type="button"
            onClick={() =>
              navigateBack(router, defaultBackHref(accountType), accountType)
            }
            className="-ml-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-ona-ink transition-colors hover:bg-black/5 active:opacity-70 dark:hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[20px] font-semibold tracking-tight text-ona-ink">
            Profile
          </h1>
          <NavMenuButton />
        </header>

        {/* User Identity: Centered Avatar + Badge + Name + Email */}
        <section className="mb-4">
          <ProfileIdentityCard userProfile={userProfile} isLight={isLight} />
        </section>

        {/* Profile Menu Card */}
        <section className="mb-7">
          <ProfileMenuCard isLight={isLight} />
        </section>

        {/* Logout Button */}
        <section className="pt-1">
          <ProfileLogoutButton isLight={isLight} />
        </section>
      </div>
    </div>
  );
}
