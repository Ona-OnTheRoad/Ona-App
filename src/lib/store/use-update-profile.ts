import { useCallback } from "react";
import { MAX_RADIUS_KM } from "@/lib/matching";
import { isProService } from "@/lib/pro-service-id";
import { getVehiclesServedLock } from "@/lib/profile-edit";
import { isExperienceUnset } from "@/lib/profile-system";
import {
  backendUpdateProfile,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { UserProfile } from "@/lib/types";
import type { SessionStateResult } from "./use-session-state";
import type { ProfilePersistenceResult } from "./use-profile-persistence";

export function useUpdateProfile(
  session: SessionStateResult,
  profileApi: ProfilePersistenceResult,
) {
  const {
    setDisplayName,
    userProfile,
    setRegisteredAsState,
    setProServicesState,
  } = session;
  const { persistProfile } = profileApi;

  const updateUserProfile = useCallback(
    (
      patch: Partial<UserProfile> & { vehiclesServedChange?: boolean },
    ): string | null => {
      if (!userProfile) return "Sign in to edit your profile.";

      const { vehiclesServedChange, ...fields } = patch;

      if (vehiclesServedChange) {
        const lock = getVehiclesServedLock(userProfile.vehiclesServedUpdatedAt);
        if (lock.locked) return lock.message;
      }

      const next: UserProfile = {
        ...userProfile,
        password: userProfile.password,
        ...fields,
        // Never allow account type flip via profile edit
        accountType: userProfile.accountType,
        email: fields.email?.trim() || userProfile.email,
        // Name is immutable for all roles after signup
        fullName: (userProfile.fullName || "").trim(),
        phone: fields.phone ?? userProfile.phone,
      };

      if (vehiclesServedChange) {
        next.vehiclesServedUpdatedAt = new Date().toISOString();
      }

      if (next.accountType === "professional") {
        // Years: allow set only once if unset at signup
        if (!isExperienceUnset(userProfile.yearsExperience)) {
          next.yearsExperience = userProfile.yearsExperience;
        } else if (
          fields.yearsExperience != null &&
          !isExperienceUnset(fields.yearsExperience)
        ) {
          next.yearsExperience = String(fields.yearsExperience).trim();
        } else {
          next.yearsExperience = userProfile.yearsExperience;
        }
        const lockedSkill =
          (userProfile.services ?? []).filter(isProService)[0] ??
          (next.services ?? []).filter(isProService)[0];
        next.services = lockedSkill ? [lockedSkill] : userProfile.services;
        // Service radius hard-cap 5 km
        if (next.serviceRadiusKm != null) {
          next.serviceRadiusKm = Math.min(
            MAX_RADIUS_KM,
            Math.max(1, next.serviceRadiusKm),
          );
        }
        if (next.services?.[0]) {
          setProServicesState([next.services[0]]);
          setRegisteredAsState(next.services[0]);
        }
      }

      if (!next.fullName) return "Name is required.";

      const bankChanged =
        fields.bankCode !== undefined ||
        fields.bankAccountNumber !== undefined ||
        fields.bankAccountName !== undefined ||
        fields.bankName !== undefined;

      // Bank uniqueness must succeed on server before we keep local bank fields
      if (bankChanged && isAppBackendOnline()) {
        // Fire-and-forget for non-bank fields still ok; bank is sync-checked by API
        // on save paths that await checkBankAccountAvailable first.
      }

      persistProfile(next);
      if (next.fullName) setDisplayName(next.fullName);

      // Sync new frontend fields to Supabase when online
      if (isAppBackendOnline()) {
        void (async () => {
          try {
            const sb = (
              await import("@/lib/supabase/app-client")
            ).getAppSupabase();
            const session = sb
              ? (await sb.auth.getSession()).data.session
              : null;
            if (!session?.access_token) return;
            const isPro = next.accountType === "professional";
            const pwdChanged =
              next.password && next.password !== userProfile.password;
            const errMsg = await backendUpdateProfile(session.access_token, {
              // Pros cannot change full name via profile edit
              ...(pwdChanged ? { password: next.password } : {}),
              fullName: isPro ? undefined : next.fullName,
              phone: next.phone,
              gender: next.gender,
              dateOfBirth: next.dateOfBirth,
              city: next.city,
              area: next.area,
              avatarUrl: next.avatarUrl,
              businessName: next.businessName,
              bio: isPro ? next.bio : undefined,
              // Pros: send years only when setting for the first time (or non-pro)
              yearsExperience: isPro
                ? isExperienceUnset(userProfile.yearsExperience) &&
                  !isExperienceUnset(next.yearsExperience)
                  ? next.yearsExperience
                  : undefined
                : next.yearsExperience,
              serviceRadiusKm: next.serviceRadiusKm,
              // Pros: only primary signup skill (server also enforces)
              services: isPro ? next.services?.slice(0, 1) : next.services,
              labourPrices: next.servicePrices,
              pricingCurrency: next.pricingCurrency,
              vehicleMake: next.vehicleMake,
              vehicleModel: next.vehicleModel,
              vehicleYear: next.vehicleYear,
              plateNumber: next.vehiclePlate,
              vehiclePhoto: next.vehiclePhoto,
              vehicleCommonIssues: next.vehicleCommonIssues,
              vehicles: next.vehicles,
              emergencyContact: next.emergencyContact ?? null,
              guarantor: next.guarantor,
              savedLocations: next.savedLocations,
              bankName: next.bankName,
              bankAccountName: next.bankAccountName,
              bankAccountNumber: next.bankAccountNumber,
              bankCode: next.bankCode,
              phoneVerified: next.phoneVerified,
              faceLivenessVerified: next.faceLivenessVerified,
              servedVehicleType: next.servedVehicleType,
              servedBrand: next.servedBrand,
              servedModel: next.servedModel,
              servedCountry: next.servedCountry,
              servedLocation: next.servedLocation,
              skillAnswers: next.skillAnswers,
            });
            // Roll back local bank if server rejected (e.g. already in use)
            if (errMsg && bankChanged) {
              persistProfile({
                ...userProfile,
                bankName: userProfile.bankName,
                bankAccountName: userProfile.bankAccountName,
                bankAccountNumber: userProfile.bankAccountNumber,
                bankCode: userProfile.bankCode,
              });
              console.warn("[profile] bank save rejected:", errMsg);
            }
          } catch {
            /* local vault already saved */
          }
        })();
      }
      return null;
    },
    [
      userProfile,
      persistProfile,
      setDisplayName,
      setProServicesState,
      setRegisteredAsState,
    ],
  );
  return {
    updateUserProfile,
  };
}

export type UpdateProfileResult = ReturnType<typeof useUpdateProfile>;
