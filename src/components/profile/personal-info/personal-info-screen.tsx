"use client";

import { useMotoristOwnProfile } from "@/components/profile/motorist-own-profile/use-motorist-own-profile";
import { PersonalInfoHeader } from "./personal-info-header";
import { ContactSecurityCard } from "./contact-security-card";
import { PersonalVehiclesCard } from "./personal-vehicles-card";
import { useApp } from "@/lib/store";

interface PersonalInfoScreenProps {
  isLight?: boolean;
}

export function PersonalInfoScreen({ isLight: propIsLight }: PersonalInfoScreenProps) {
  const { theme } = useApp();
  const isLight = propIsLight ?? theme === "light";
  const p = useMotoristOwnProfile();
  const { userProfile, updateUserProfile, accessToken } = p;

  if (!userProfile) {
    return (
      <div className="ona2 flex h-full items-center justify-center text-sm font-semibold bg-ona-bg text-ona-ink">
        Loading personal info…
      </div>
    );
  }

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-24 sm:pb-28">
        {/* Header: Back button, Title, Avatar with camera badge, Name, Member since */}
        <PersonalInfoHeader
          userProfile={userProfile}
          isLight={isLight}
          accessToken={accessToken}
          onAvatarUpdated={(url) => {
            updateUserProfile({ avatarUrl: url });
            p.setMsg("Profile photo updated.");
          }}
          onError={p.setErr}
        />

        {/* Section 1: Contact & Security Card */}
        <section className="mt-2">
          <ContactSecurityCard
            isLight={isLight}
            userProfile={userProfile}
            accessToken={accessToken}
            updateUserProfile={updateUserProfile}
          />
        </section>

        {/* Divider matching Image 1 */}
        <div className="my-6 border-t border-ona-border" />

        {/* Section 2: Vehicles Section & Cards */}
        <section>
          <PersonalVehiclesCard
            isLight={isLight}
            vehicles={p.vehicles}
            addingVehicle={p.addingVehicle}
            setAddingVehicle={p.setAddingVehicle}
            persistVehicles={p.persistVehicles}
            setMsg={p.setMsg}
            setErr={p.setErr}
          />
        </section>
      </div>
    </div>
  );
}
