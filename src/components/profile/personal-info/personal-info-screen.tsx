"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMotoristOwnProfile } from "@/components/profile/motorist-own-profile/use-motorist-own-profile";
import { navigateBack } from "@/lib/navigation";
import { PersonalInfoHeader } from "./personal-info-header";
import { ContactSecurityCard } from "./contact-security-card";
import { PersonalVehiclesCard } from "./personal-vehicles-card";
import { ProPersonalInfoCard } from "./pro-personal-info-card";
import { useApp } from "@/lib/store";

interface PersonalInfoScreenProps {
  isLight?: boolean;
}

export function PersonalInfoScreen({ isLight: propIsLight }: PersonalInfoScreenProps) {
  const router = useRouter();
  const { theme, accountType } = useApp();
  const isLight = propIsLight ?? theme === "light";
  const p = useMotoristOwnProfile();
  const { userProfile, updateUserProfile, accessToken } = p;
  const isPro = accountType === "professional";

  if (!userProfile) {
    return (
      <div className="ona2 flex h-full items-center justify-center text-sm font-semibold bg-ona-bg text-ona-muted">
        Loading personal info…
      </div>
    );
  }

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20">
        {/* Top Header for Pro */}
        {isPro ? (
          <header className="flex items-center gap-3 py-3 pt-2">
            <button
              type="button"
              onClick={() => navigateBack(router, "/profile", "professional")}
              className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.4} />
            </button>
            <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">Personal Info</h1>
          </header>
        ) : (
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
        )}

        {isPro ? (
          <ProPersonalInfoCard userProfile={userProfile} isLight={isLight} />
        ) : (
          <>
            <section className="mt-2">
              <ContactSecurityCard
                isLight={isLight}
                userProfile={userProfile}
                accessToken={accessToken}
                updateUserProfile={updateUserProfile}
              />
            </section>
            <div className="my-6 border-t border-ona-border" />
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
          </>
        )}
      </div>
    </div>
  );
}
