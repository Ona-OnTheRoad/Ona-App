"use client";

import { useMotoristOwnProfile } from "@/components/profile/motorist-own-profile/use-motorist-own-profile";
import { MotoristProfileHub } from "@/components/profile/motorist-profile/motorist-profile-hub";
import { ProfileShell } from "@/components/profile/profile-shell";

/**
 * Motorist own profile hub screen.
 * Displays user identity, verification badge, and quick access menu card.
 */
export function MotoristOwnProfile({ isLight }: { isLight: boolean }) {
  const { userProfile } = useMotoristOwnProfile();

  if (!userProfile || userProfile.accountType !== "motorist") {
    return (
      <ProfileShell
        isLight={isLight}
        title="Profile"
        error="Sign in as a Customer to view this profile."
      />
    );
  }

  return <MotoristProfileHub isLight={isLight} />;
}
