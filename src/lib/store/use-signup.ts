import { useCallback } from "react";
import { isProService } from "@/lib/pro-service-id";
import { saveProfileToVault } from "@/lib/profiles-vault";
import { backendSignUp, isAppBackendOnline } from "@/lib/supabase/app-api";
import type { AccountType, ProService, UserProfile } from "@/lib/types";
import { readStoredPrimaryAccount, writeStoredPrimaryAccount } from "./storage";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";
import type { ApplySessionResult } from "./use-apply-session";

export function useSignup(
  session: SessionStateResult,
  market: MarketStateResult,
  applyApi: ApplySessionResult,
) {
  const {
    primaryAccountType,
    userProfile,
    hasMotoristAccount,
    setHasMotoristAccount,
    setHasProAccount,
    setBackendUserId,
    setServerSessionReady,
  } = session;
  const { location } = market;
  const { applySession } = applyApi;

  const completeSignup = useCallback(
    async (profile: UserProfile): Promise<string | null> => {
      // Pros: enforce single skill on profile
      const normalized: UserProfile =
        profile.accountType === "professional"
          ? {
              ...profile,
              services: (profile.services ?? [])
                .filter(isProService)
                .slice(0, 1),
            }
          : profile;

      if (!normalized.email?.trim() || !normalized.password) {
        return "Email and password are required to create your account.";
      }

      // Hard requirement: live Supabase write no silent local-only signup
      if (!isAppBackendOnline()) {
        return "Server is unavailable. Check your connection and try again accounts must save to Ona.";
      }

      const labourPrices = normalized.servicePrices;
      // Slim cert payload full base64 in skills jsonb breaks vulcanizer/pro signup
      const rawSkills = (normalized.skillAnswers || {}) as Record<
        string,
        unknown
      >;
      const slimSkills: Record<string, unknown> = { ...rawSkills };
      if (
        slimSkills.certificationUpload &&
        typeof slimSkills.certificationUpload === "object"
      ) {
        const f = slimSkills.certificationUpload as {
          name?: string;
          mime?: string;
          dataUrl?: string;
        };
        slimSkills.certificationUpload = {
          name: f.name || "certificate",
          mime: f.mime,
          hasFile: Boolean(f.dataUrl || f.name),
        };
      }
      let certData = normalized.certificationFileDataUrl;
      if (
        (!certData || !String(certData).startsWith("data:")) &&
        rawSkills.certificationUpload &&
        typeof rawSkills.certificationUpload === "object"
      ) {
        const f = rawSkills.certificationUpload as { dataUrl?: string };
        if (typeof f.dataUrl === "string") certData = f.dataUrl;
      }
      // Cap body size so free-tier / Next body limits do not kill signup
      if (certData && certData.length > 400_000) {
        certData = undefined;
      }

      if (!normalized.gender || !normalized.dateOfBirth) {
        return "Gender and date of birth are required.";
      }

      const res = await backendSignUp({
        email: normalized.email,
        password: normalized.password,
        fullName: normalized.fullName,
        phone: normalized.phone,
        accountType: normalized.accountType,
        gender: normalized.gender,
        dateOfBirth: normalized.dateOfBirth,
        city: normalized.city,
        area: normalized.area,
        businessName: normalized.businessName,
        primaryService: normalized.services?.[0],
        services: normalized.services,
        bio: normalized.bio,
        yearsExperience: normalized.yearsExperience,
        serviceRadiusKm: normalized.serviceRadiusKm,
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        vehicleMake: normalized.vehicleMake,
        vehicleModel: normalized.vehicleModel,
        vehicleYear: normalized.vehicleYear,
        plateNumber: normalized.vehiclePlate,
        vehiclePhoto: normalized.vehiclePhoto,
        vehicleCommonIssues: normalized.vehicleCommonIssues,
        vehicles: normalized.vehicles,
        avatarUrl: normalized.avatarUrl,
        nin: normalized.idNumber,
        bvn: normalized.bvn,
        labourPrices,
        pricingCurrency: normalized.pricingCurrency,
        skillAnswers: slimSkills,
        servedVehicleType: normalized.servedVehicleType,
        servedBrand: normalized.servedBrand,
        servedModel: normalized.servedModel,
        servedCountry: normalized.servedCountry,
        servedLocation: normalized.servedLocation,
        emergencyContact: normalized.emergencyContact,
        bankName: normalized.bankName,
        bankAccountName: normalized.bankAccountName,
        bankAccountNumber: normalized.bankAccountNumber,
        bankCode: normalized.bankCode,
        guarantor: normalized.guarantor,
        docsStatus: normalized.docsStatus,
        certificationFileName: normalized.certificationFileName,
        certificationFileDataUrl: certData,
        // Dual role: keep motorist when adding Repair Pro (and vice versa)
        keepOtherRole: true,
        refCode: normalized.refCode,
      });

      if (res.error || !res.profile || !res.userId) {
        return (
          res.error ||
          "Could not save your account to the server. Please try again."
        );
      }

      // Only open the app after a real server user id exists
      setBackendUserId(res.userId);
      // Preserve original primary account when adding a second role
      const existingPrimary =
        readStoredPrimaryAccount() ||
        primaryAccountType ||
        userProfile?.primaryAccountType ||
        null;
      const primary: AccountType =
        existingPrimary && existingPrimary !== res.profile.accountType
          ? existingPrimary
          : res.profile.accountType;
      const signedUp: UserProfile = {
        ...normalized,
        ...res.profile,
        primaryAccountType: primary,
        name_locked: true,
        // Merge vault extras the server may not echo yet
        servicePrices: normalized.servicePrices ?? res.profile.servicePrices,
        pricingCurrency:
          normalized.pricingCurrency ?? res.profile.pricingCurrency,
        skillAnswers: normalized.skillAnswers ?? res.profile.skillAnswers,
        docsStatus: normalized.docsStatus ?? res.profile.docsStatus,
        docsRatingBoostApplied:
          normalized.docsRatingBoostApplied ??
          res.profile.docsRatingBoostApplied,
        certificationFileName:
          normalized.certificationFileName ?? res.profile.certificationFileName,
        certificationFileDataUrl:
          normalized.certificationFileDataUrl ??
          res.profile.certificationFileDataUrl,
        averageRating:
          normalized.averageRating ?? res.profile.averageRating ?? 0,
        servedVehicleType:
          normalized.servedVehicleType ?? res.profile.servedVehicleType,
        servedBrand: normalized.servedBrand ?? res.profile.servedBrand,
        servedModel: normalized.servedModel ?? res.profile.servedModel,
        servedCountry: normalized.servedCountry ?? res.profile.servedCountry,
        servedLocation: normalized.servedLocation ?? res.profile.servedLocation,
        vehicles: res.profile.vehicles ?? normalized.vehicles,
        vehicleMake: res.profile.vehicleMake ?? normalized.vehicleMake,
        vehicleModel: res.profile.vehicleModel ?? normalized.vehicleModel,
        vehicleYear: res.profile.vehicleYear ?? normalized.vehicleYear,
      };
      if (!existingPrimary) {
        writeStoredPrimaryAccount(res.profile.accountType);
      }
      saveProfileToVault(signedUp);
      applySession(signedUp);
      setServerSessionReady(true);
      if (res.profile.accountType === "motorist") {
        setHasMotoristAccount(true);
      } else {
        setHasProAccount(true);
        // Keep motorist flag if they already had it (dual)
        if (hasMotoristAccount || existingPrimary === "motorist") {
          setHasMotoristAccount(true);
        }
      }
      return null;
    },
    [
      applySession,
      location.coordinates.lat,
      location.coordinates.lng,
      primaryAccountType,
      userProfile?.primaryAccountType,
      hasMotoristAccount,
      setBackendUserId,
      setHasMotoristAccount,
      setHasProAccount,
      setServerSessionReady,
    ],
  );

  const login = useCallback(
    (_opts: {
      accountType: AccountType;
      name?: string;
      proService?: ProService;
      proServices?: ProService[];
    }) => {
      // Demo shortcut disabled must use real server signup / login
      console.warn(
        "Quick demo login is disabled. Use Sign up or Log in against the server.",
      );
    },
    [],
  );
  return {
    completeSignup,
    login,
  };
}

export type SignupResult = ReturnType<typeof useSignup>;
