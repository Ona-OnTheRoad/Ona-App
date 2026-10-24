"use client";

import { useApp } from "@/lib/store";
import { ProfileIdentityCard } from "./profile-identity-card";
import { ProfileMenuCard } from "./profile-menu-card";
import { ProfileLogoutButton } from "./profile-logout-button";

interface MotoristProfileHubProps {
  isLight?: boolean;
}

export function MotoristProfileHub({ isLight }: MotoristProfileHubProps) {
  const { userProfile } = useApp();

  if (!userProfile) return null;

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pt-4 pb-6">
        {/* Screen Title */}
        <header className="pt-2 pb-2">
          <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
            Profile
          </h1>
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
