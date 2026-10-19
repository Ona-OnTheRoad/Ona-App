"use client";

import { useRouter } from "next/navigation";
import {
  ProfileIdentityHeader,
  ProfileShell,
} from "@/components/profile/profile-shell";
import {
  AvatarFileInput,
  AvatarPickerButton,
} from "@/components/profile/shared/avatar-picker";
import { EditFooter } from "@/components/profile/shared/edit-footer";
import { profileFieldClass } from "@/components/profile/shared/field-class";
import {
  ContactSecuritySection,
  NameSection,
} from "@/components/profile/shared/security-sections";
import {
  EmergencyContactSection,
  MotoristStatsSection,
} from "@/components/profile/motorist-own-profile/emergency-stats-sections";
import { SavedLocationsSection } from "@/components/profile/motorist-own-profile/saved-locations-section";
import { useMotoristOwnProfile } from "@/components/profile/motorist-own-profile/use-motorist-own-profile";
import { MotoristVerificationSection } from "@/components/profile/motorist-own-profile/verification-section";
import { VehiclesSection } from "@/components/profile/motorist-own-profile/vehicles-section";
import { memberSinceLabel } from "@/lib/profile-system";

/**
 * 2. Motorist own profile editable only by the motorist.
 */
export function MotoristOwnProfile({ isLight }: { isLight: boolean }) {
  const router = useRouter();
  const p = useMotoristOwnProfile();
  const { userProfile, updateUserProfile, editing } = p;

  if (!userProfile || userProfile.accountType !== "motorist") {
    return (
      <ProfileShell
        isLight={isLight}
        title="My Profile"
        error="Sign in as a Customer to view this profile."
      />
    );
  }

  const field = profileFieldClass(isLight);

  return (
    <ProfileShell
      isLight={isLight}
      title="My Profile"
      showEdit={!editing}
      onEdit={() => {
        if (!userProfile) return;
        p.syncFromProfile(userProfile);
        p.setEditing(true);
        p.setMsg(null);
        p.setErr(null);
      }}
      footer={
        editing ? (
          <EditFooter
            isLight={isLight}
            onCancel={() => {
              p.setEditing(false);
              p.syncFromProfile(userProfile);
            }}
            onSave={p.save}
          />
        ) : undefined
      }
    >
      <ProfileIdentityHeader
        isLight={isLight}
        name={userProfile.fullName}
        roleLabel="Customer"
        meta={`Member since ${memberSinceLabel(userProfile.registeredAt)}`}
        avatar={
          <AvatarPickerButton
            editing={editing}
            avatarUrl={p.avatarUrl}
            fullName={userProfile.fullName}
            onPick={() => p.fileRef.current?.click()}
          />
        }
      />
      <AvatarFileInput
        fileRef={p.fileRef}
        accessToken={p.accessToken}
        onUrl={p.setAvatarUrl}
        onError={p.setErr}
      />

      <ContactSecuritySection
        isLight={isLight}
        userProfile={userProfile}
        accessToken={p.accessToken}
        updateUserProfile={updateUserProfile}
      />

      <NameSection
        isLight={isLight}
        userProfile={userProfile}
        accessToken={p.accessToken}
      />

      <MotoristVerificationSection
        isLight={isLight}
        userProfile={userProfile}
        onContinue={() => router.push("/verify")}
      />

      <VehiclesSection
        isLight={isLight}
        vehicles={p.vehicles}
        addingVehicle={p.addingVehicle}
        setAddingVehicle={p.setAddingVehicle}
        setMsg={p.setMsg}
        setErr={p.setErr}
        persistVehicles={p.persistVehicles}
      />

      <SavedLocationsSection
        isLight={isLight}
        editing={editing}
        field={field}
        saved={p.saved}
        setSaved={p.setSaved}
        onAdd={p.addLocation}
      />

      <EmergencyContactSection
        isLight={isLight}
        userProfile={userProfile}
        editing={editing}
        field={field}
        emName={p.emName}
        setEmName={p.setEmName}
        emPhone={p.emPhone}
        setEmPhone={p.setEmPhone}
      />

      <MotoristStatsSection
        isLight={isLight}
        jobsRequested={p.jobsRequested}
        jobsCompleted={p.jobsCompleted}
        ratingGiven={p.ratingGiven}
      />
      {/* Recent jobs live on the Repair Pro dashboard only */}
    </ProfileShell>
  );
}
