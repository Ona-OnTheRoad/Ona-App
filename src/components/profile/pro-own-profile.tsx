"use client";

import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewAccountBadge } from "@/components/profile/new-account-badge";
import {
  ProfileIdentityHeader,
  ProfileSection,
  ProfileShell,
} from "@/components/profile/profile-shell";
import { profileFieldClass } from "@/components/profile/shared/field-class";
import {
  AvatarFileInput,
  AvatarPickerButton,
} from "@/components/profile/shared/avatar-picker";
import { EditFooter } from "@/components/profile/shared/edit-footer";
import {
  ContactSecuritySection,
  NameSection,
} from "@/components/profile/shared/security-sections";
import { StatusMessage } from "@/components/profile/shared/status-message";
import { ProDocsBanner } from "@/components/profile/pro-own-profile/docs-banner";
import {
  BioSection,
  ExperienceSection,
  RadiusSection,
  SkillSection,
} from "@/components/profile/pro-own-profile/detail-sections";
import { GuarantorSection } from "@/components/profile/pro-own-profile/guarantor-section";
import { PayoutCacSections } from "@/components/profile/pro-own-profile/payout-cac-sections";
import { ProStatsSection } from "@/components/profile/pro-own-profile/stats-section";
import { ProStatusSection } from "@/components/profile/pro-own-profile/status-section";
import { useProOwnProfile } from "@/components/profile/pro-own-profile/use-pro-own-profile";
import { ProVerificationSection } from "@/components/profile/pro-own-profile/verification-section";
import {
  clampProServiceRadiusKm,
  hasVerificationMark,
  memberSinceLabel,
} from "@/lib/profile-system";

/**
 * Repair Pro own profile.
 * Locked after signup: full name, single skill; years only if already set.
 * Edit via header pencil. Labour prices not on My Profile.
 */
export function ProOwnProfile({ isLight }: { isLight: boolean }) {
  const router = useRouter();
  const p = useProOwnProfile();
  const { userProfile, updateUserProfile, proLive, editing } = p;

  if (!userProfile || userProfile.accountType !== "professional") {
    return (
      <ProfileShell
        isLight={isLight}
        title="My Profile"
        error="Sign in as a Repair Pro to view this profile."
      />
    );
  }

  const jobs = userProfile.jobsCompleted ?? 0;
  const field = profileFieldClass(isLight);
  const lockedField = isLight
    ? "text-[13px] font-semibold text-slate-900"
    : "text-[13px] font-semibold text-white";

  const displayRadius = clampProServiceRadiusKm(
    editing ? p.radiusKm : userProfile.serviceRadiusKm,
  );

  return (
    <ProfileShell
      isLight={isLight}
      title="My Profile"
      showEdit={!editing}
      onEdit={() => {
        if (!userProfile) return;
        p.sync(userProfile);
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
              p.sync(userProfile);
            }}
            onSave={p.save}
          />
        ) : (
          <Button
            size="lg"
            className="h-11 w-full"
            disabled={p.liveBusy}
            onClick={() => void p.toggleLive()}
          >
            <Radio className="h-4 w-4" />
            {proLive ? "Go Offline" : "Go Online"}
          </Button>
        )
      }
    >
      <StatusMessage msg={p.msg} err={p.err} />

      <ProDocsBanner isLight={isLight} userProfile={userProfile} />

      <ProfileIdentityHeader
        isLight={isLight}
        name={userProfile.fullName}
        roleLabel="Repair Pro"
        meta={`Member since ${memberSinceLabel(userProfile.registeredAt)}`}
        badge={
          <NewAccountBadge
            visibilityTier={p.artisan?.visibilityTier ?? 1}
            status={p.artisan?.status}
            size="sm"
          />
        }
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

      <ProStatusSection
        isLight={isLight}
        userProfile={userProfile}
        jobs={jobs}
        editing={editing}
        field={field}
        businessName={p.businessName}
        setBusinessName={p.setBusinessName}
        proLive={proLive}
        liveBusy={p.liveBusy}
        onToggleLive={() => void p.toggleLive()}
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

      <ExperienceSection
        isLight={isLight}
        userProfile={userProfile}
        editing={editing}
        canSetExperience={p.canSetExperience}
        field={field}
        lockedField={lockedField}
        years={p.years}
        setYears={p.setYears}
      />

      <SkillSection isLight={isLight} lockedSkills={p.lockedSkills} />

      <BioSection
        isLight={isLight}
        userProfile={userProfile}
        editing={editing}
        bio={p.bio}
        setBio={p.setBio}
      />

      <RadiusSection
        isLight={isLight}
        editing={editing}
        radiusKm={p.radiusKm}
        setRadiusKm={p.setRadiusKm}
        displayRadius={displayRadius}
      />

      <ProStatsSection
        isLight={isLight}
        userProfile={userProfile}
        jobs={jobs}
      />

      <ProVerificationSection
        isLight={isLight}
        userProfile={userProfile}
        showLiveness={p.showLiveness}
        setShowLiveness={p.setShowLiveness}
        onVerify={() => router.push("/verify")}
        onLivenessPassed={() => {
          updateUserProfile({
            faceLivenessVerified: true,
            faceLivenessAt: new Date().toISOString(),
          });
          p.setShowLiveness(false);
          p.setMsg("Face liveness passed (Tier 2 progress).");
        }}
      />

      {hasVerificationMark(userProfile) && (
        <PayoutCacSections
          isLight={isLight}
          userProfile={userProfile}
          accessToken={p.accessToken}
          updateUserProfile={updateUserProfile}
          setMsg={p.setMsg}
          setErr={p.setErr}
        />
      )}

      <GuarantorSection
        isLight={isLight}
        userProfile={userProfile}
        editing={editing}
        field={field}
        gName={p.gName}
        setGName={p.setGName}
        gPhone={p.gPhone}
        setGPhone={p.setGPhone}
        gOccupation={p.gOccupation}
        setGOccupation={p.setGOccupation}
        gAddress={p.gAddress}
        setGAddress={p.setGAddress}
        gRelationship={p.gRelationship}
        setGRelationship={p.setGRelationship}
      />

      <ProfileSection title="Public preview" isLight={isLight}>
        <button
          type="button"
          onClick={() => router.push(`/technician/${p.backendUserId}`)}
          className="text-[12px] font-bold text-brand"
        >
          View as motorists see you →
        </button>
      </ProfileSection>
    </ProfileShell>
  );
}
