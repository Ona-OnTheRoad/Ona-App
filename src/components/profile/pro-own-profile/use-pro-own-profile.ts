"use client";

import { useMemo, useRef, useState } from "react";
import { useAccessToken } from "@/components/profile/shared/use-access-token";
import { primarySkill } from "@/components/profile/pro-own-profile/helpers";
import { getArtisanProfile } from "@/lib/artisan/local-store";
import {
  clampProServiceRadiusKm,
  isExperienceUnset,
} from "@/lib/profile-system";
import { useApp } from "@/lib/store";
import type { UserProfile } from "@/lib/types";

/** State, sync, save and live toggle for the Repair Pro own profile. */
export function useProOwnProfile() {
  const {
    userProfile,
    updateUserProfile,
    proLive,
    setProLive,
    proServices,
    backendUserId,
  } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const lockedSkills = useMemo(
    () => primarySkill(userProfile, proServices),
    [userProfile, proServices],
  );
  const artisan = useMemo(
    () =>
      userProfile?.identityId
        ? getArtisanProfile(userProfile.identityId)
        : null,
    [userProfile],
  );
  const canSetExperience = isExperienceUnset(userProfile?.yearsExperience);

  const accessToken = useAccessToken();

  const [editing, setEditing] = useState(false);
  const [showLiveness, setShowLiveness] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [liveBusy, setLiveBusy] = useState(false);

  const [businessName, setBusinessName] = useState(
    userProfile?.businessName || "",
  );
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [years, setYears] = useState(userProfile?.yearsExperience || "");
  const [radiusKm, setRadiusKm] = useState(
    clampProServiceRadiusKm(userProfile?.serviceRadiusKm),
  );
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || "");
  const [gName, setGName] = useState(userProfile?.guarantor?.fullName || "");
  const [gPhone, setGPhone] = useState(userProfile?.guarantor?.phone || "");
  const [gOccupation, setGOccupation] = useState(
    userProfile?.guarantor?.occupation || "",
  );
  const [gAddress, setGAddress] = useState(
    userProfile?.guarantor?.address || "",
  );
  const [gRelationship, setGRelationship] = useState(
    userProfile?.guarantor?.relationship || "",
  );

  const sync = (p: UserProfile | null | undefined) => {
    setBusinessName(p?.businessName || "");
    setBio(p?.bio || "");
    setYears(p?.yearsExperience || "");
    setRadiusKm(clampProServiceRadiusKm(p?.serviceRadiusKm));
    setAvatarUrl(p?.avatarUrl || "");
    setGName(p?.guarantor?.fullName || "");
    setGPhone(p?.guarantor?.phone || "");
    setGOccupation(p?.guarantor?.occupation || "");
    setGAddress(p?.guarantor?.address || "");
    setGRelationship(p?.guarantor?.relationship || "");
  };

  const save = () => {
    // Only reachable once the profile screen has rendered (profile non-null).
    if (!userProfile) return;
    setErr(null);
    setMsg(null);
    const skill = lockedSkills[0];
    const expUnset = isExperienceUnset(userProfile.yearsExperience);
    const e = updateUserProfile({
      businessName: businessName.trim() || undefined,
      bio: bio.slice(0, 144) || undefined,
      // One-time: only if still unset and user picked a value
      ...(expUnset && !isExperienceUnset(years)
        ? { yearsExperience: years.trim() }
        : {}),
      services: skill ? [skill] : userProfile.services,
      serviceRadiusKm: clampProServiceRadiusKm(radiusKm),
      avatarUrl: avatarUrl || undefined,
      guarantor: {
        fullName: gName.trim(),
        phone: gPhone.trim(),
        address: gAddress.trim() || undefined,
        occupation: gOccupation.trim() || undefined,
        relationship: gRelationship.trim(),
      },
    });
    if (e) {
      setErr(e);
      return;
    }
    setMsg("Profile saved.");
    setEditing(false);
  };

  const toggleLive = async () => {
    setLiveBusy(true);
    try {
      await setProLive(!proLive);
    } finally {
      setLiveBusy(false);
    }
  };

  return {
    userProfile,
    updateUserProfile,
    proLive,
    backendUserId,
    fileRef,
    lockedSkills,
    artisan,
    canSetExperience,
    accessToken,
    editing,
    setEditing,
    showLiveness,
    setShowLiveness,
    msg,
    setMsg,
    err,
    setErr,
    liveBusy,
    businessName,
    setBusinessName,
    bio,
    setBio,
    years,
    setYears,
    radiusKm,
    setRadiusKm,
    avatarUrl,
    setAvatarUrl,
    gName,
    setGName,
    gPhone,
    setGPhone,
    gOccupation,
    setGOccupation,
    gAddress,
    setGAddress,
    gRelationship,
    setGRelationship,
    sync,
    save,
    toggleLive,
  };
}
