"use client";

import { useRef, useState } from "react";
import {
  legacyFieldsFromVehicles,
  vehiclesFromProfile,
} from "@/components/profile/motorist-own-profile/helpers";
import { useAccessToken } from "@/components/profile/shared/use-access-token";
import { useApp } from "@/lib/store";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import type { MotoristVehicle, UserProfile } from "@/lib/types";

/** State, sync, save and vehicle persistence for the motorist own profile. */
export function useMotoristOwnProfile() {
  const { userProfile, updateUserProfile, location } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const accessToken = useAccessToken();

  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useFeedbackToast(msg ?? "", err ?? "");

  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || "");
  const [vehicles, setVehicles] = useState<MotoristVehicle[]>(() =>
    userProfile ? vehiclesFromProfile(userProfile) : [],
  );
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [emName, setEmName] = useState(
    userProfile?.emergencyContact?.name || "",
  );
  const [emPhone, setEmPhone] = useState(
    userProfile?.emergencyContact?.phone || "",
  );
  const [saved, setSaved] = useState(userProfile?.savedLocations || []);

  const jobsRequested =
    userProfile?.jobsRequested ?? userProfile?.serviceActionCount ?? 0;
  const jobsCompleted = userProfile?.jobsCompleted ?? 0;
  const ratingGiven = userProfile?.averageRatingGiven ?? 0;

  const syncFromProfile = (p: UserProfile | null | undefined) => {
    setAvatarUrl(p?.avatarUrl || "");
    setVehicles(p ? vehiclesFromProfile(p) : []);
    setAddingVehicle(false);
    setEmName(p?.emergencyContact?.name || "");
    setEmPhone(p?.emergencyContact?.phone || "");
    setSaved(p?.savedLocations || []);
  };

  const persistVehicles = (list: MotoristVehicle[]) => {
    setVehicles(list);
    const legacy = legacyFieldsFromVehicles(list);
    const e = updateUserProfile({
      vehicles: list,
      ...legacy,
    });
    if (e) {
      setErr(e);
      return false;
    }
    setMsg(list.length ? "Vehicles updated." : "Vehicle removed.");
    return true;
  };

  const save = () => {
    setErr(null);
    setMsg(null);
    const legacy = legacyFieldsFromVehicles(vehicles);
    const e = updateUserProfile({
      avatarUrl: avatarUrl || undefined,
      vehicles,
      ...legacy,
      emergencyContact:
        emName.trim() || emPhone.trim()
          ? { name: emName.trim(), phone: emPhone.trim() }
          : undefined,
      savedLocations: saved,
    });
    if (e) {
      setErr(e);
      return;
    }
    setMsg("Profile saved.");
    setEditing(false);
    setAddingVehicle(false);
  };

  const addLocation = () => {
    const id = `loc-${Date.now()}`;
    setSaved((prev) => [
      ...prev,
      {
        id,
        label: "Saved place",
        address: location.label || "Current pin",
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
      },
    ]);
  };

  return {
    userProfile,
    updateUserProfile,
    fileRef,
    accessToken,
    editing,
    setEditing,
    msg,
    setMsg,
    err,
    setErr,
    avatarUrl,
    setAvatarUrl,
    vehicles,
    addingVehicle,
    setAddingVehicle,
    emName,
    setEmName,
    emPhone,
    setEmPhone,
    saved,
    setSaved,
    jobsRequested,
    jobsCompleted,
    ratingGiven,
    syncFromProfile,
    persistVehicles,
    save,
    addLocation,
  };
}
